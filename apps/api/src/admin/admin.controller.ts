import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Headers,
  Sse,
  MessageEvent,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalRole } from '@saas/database';
import { HttpService } from '@nestjs/axios';
import {
  lastValueFrom,
  catchError,
  Observable,
  Subject,
  interval,
  switchMap,
  startWith,
  merge,
  map,
  throttleTime,
} from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { QueueEvents } from 'bullmq';
import Redis from 'ioredis';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  private queueEvents: QueueEvents;
  private queueEventsSubject = new Subject<void>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    connection.on('error', (err) =>
      console.error('Redis SSE Error:', err.message),
    );

    // Listen to queue events from Search API's crawl-queue
    this.queueEvents = new QueueEvents('crawl-queue', { connection });

    // Broadcast on any relevant queue event
    this.queueEvents.on('waiting', () => this.queueEventsSubject.next());
    this.queueEvents.on('active', () => this.queueEventsSubject.next());
    this.queueEvents.on('completed', () => this.queueEventsSubject.next());
    this.queueEvents.on('failed', () => this.queueEventsSubject.next());
  }

  @Get('health')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  healthCheck(@Headers('authorization') auth?: string) {
    console.log('Health check hit. Auth:', auth?.substring(0, 20));
    return { status: 'ok', role: 'SUPER_ADMIN' };
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  async getStats(@Headers('authorization') authorization?: string) {
    const [totalUsers, totalProjects, totalOrders, revenueResult] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.order.count(),
        this.prisma.order.aggregate({
          _sum: {
            totalAmount: true,
          },
        }),
      ]);

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Fetch Search & Queue Stats from Search API
    let searchStats = {
      queue: { waiting: 0, active: 0, failed: 0, completed: 0, delayed: 0 },
      typesense: { healthy: false, totalDocuments: 0 },
    };

    try {
      const searchApiUrl =
        this.configService.get<string>('SEARCH_API_URL') ||
        'http://localhost:4002';
      if (authorization) {
        const response = await lastValueFrom(
          this.httpService.get(`${searchApiUrl}/search/admin/stats`, {
            headers: { Authorization: authorization },
          }),
        );
        if (response.data && response.data.success) {
          searchStats = response.data;
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch search stats:', err.message);
    }

    return {
      totalUsers,
      totalProjects,
      totalOrders,
      totalRevenue,
      searchStats,
    };
  }

  @Sse('stats/live')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  statsLive(
    @Headers('authorization') authorization?: string,
    @Query('token') token?: string,
  ): Observable<MessageEvent> {
    const authHeader = authorization || (token ? `Bearer ${token}` : undefined);

    // We emit immediately, and then whenever queue events occur, throttled to max 1 per 2s
    return merge(
      this.queueEventsSubject.pipe(throttleTime(2000), startWith(null)), // emit immediately & throttle
      interval(10000), // fallback heartbeat every 10s
    ).pipe(
      switchMap(async () => {
        try {
          const stats = await this.getStats(authHeader);
          return { data: stats } as MessageEvent;
        } catch (err) {
          return {
            data: { error: 'Failed to fetch live stats' },
          } as MessageEvent;
        }
      }),
    );
  }

  @Get('users')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('users/:id/role')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: GlobalRole },
    @CurrentUser() currentUser: { userId: string; role: string },
  ) {
    if (!body.role || !Object.values(GlobalRole).includes(body.role)) {
      throw new HttpException('Invalid role', HttpStatus.BAD_REQUEST);
    }

    if (currentUser.userId === id) {
      throw new HttpException('You cannot change your own role', HttpStatus.FORBIDDEN);
    }

    if (currentUser.role === 'ADMIN') {
      if (body.role === 'SUPER_ADMIN') {
        throw new HttpException('Admins cannot promote users to SUPER_ADMIN', HttpStatus.FORBIDDEN);
      }
      
      const targetUser = await this.prisma.user.findUnique({ where: { id } });
      if (!targetUser) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      
      if (targetUser.role === 'SUPER_ADMIN') {
        throw new HttpException('Admins cannot change the role of a SUPER_ADMIN', HttpStatus.FORBIDDEN);
      }
    }
    return this.prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, email: true, role: true },
    });
  }

  @Get('settings')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const settingsMap = settings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return {
      defaultAutoCrawlIntervalDays: settingsMap['defaultAutoCrawlIntervalDays']
        ? parseInt(settingsMap['defaultAutoCrawlIntervalDays'])
        : 30, // Fallback if not set
    };
  }

  @Patch('settings')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateSettings(@Body() body: { defaultAutoCrawlIntervalDays: number }) {
    if (typeof body.defaultAutoCrawlIntervalDays !== 'number') {
      throw new HttpException('Invalid setting value', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.systemSetting.upsert({
      where: { key: 'defaultAutoCrawlIntervalDays' },
      update: { value: body.defaultAutoCrawlIntervalDays.toString() },
      create: {
        key: 'defaultAutoCrawlIntervalDays',
        value: body.defaultAutoCrawlIntervalDays.toString(),
      },
    });

    return { success: true };
  }

  @Get('projects')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  async getProjects() {
    return this.prisma.project.findMany({
      select: {
        id: true,
        name: true,
        autoCrawlIntervalDays: true,
        createdAt: true,
        members: {
          where: { role: 'OWNER' },
          select: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { projectDomains: true, products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('projects/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateProject(
    @Param('id') id: string,
    @Body() body: { autoCrawlIntervalDays: number | null },
  ) {
    if (
      body.autoCrawlIntervalDays !== null &&
      (typeof body.autoCrawlIntervalDays !== 'number' ||
        body.autoCrawlIntervalDays < 0)
    ) {
      throw new HttpException(
        'Invalid autoCrawlIntervalDays',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.prisma.project.update({
      where: { id },
      data: { autoCrawlIntervalDays: body.autoCrawlIntervalDays },
    });
  }
}
