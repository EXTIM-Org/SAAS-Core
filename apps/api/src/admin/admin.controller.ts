import { Controller, Get, Patch, Param, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalRole } from '@saas/database';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @Roles('SUPER_ADMIN')
  healthCheck() {
    return { status: 'ok', role: 'SUPER_ADMIN' };
  }

  @Get('stats')
  @Roles('SUPER_ADMIN')
  async getStats() {
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

    return {
      totalUsers,
      totalProjects,
      totalOrders,
      totalRevenue,
    };
  }

  @Get('users')
  @Roles('SUPER_ADMIN')
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
  @Roles('SUPER_ADMIN')
  async updateUserRole(@Param('id') id: string, @Body() body: { role: GlobalRole }) {
    if (!body.role || !Object.values(GlobalRole).includes(body.role)) {
      throw new HttpException('Invalid role', HttpStatus.BAD_REQUEST);
    }
    return this.prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, email: true, role: true },
    });
  }

  @Get('settings')
  @Roles('SUPER_ADMIN')
  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      defaultAutoCrawlIntervalDays: settingsMap['defaultAutoCrawlIntervalDays'] 
        ? parseInt(settingsMap['defaultAutoCrawlIntervalDays']) 
        : 30, // Fallback if not set
    };
  }

  @Patch('settings')
  @Roles('SUPER_ADMIN')
  async updateSettings(@Body() body: { defaultAutoCrawlIntervalDays: number }) {
    if (typeof body.defaultAutoCrawlIntervalDays !== 'number') {
      throw new HttpException('Invalid setting value', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.systemSetting.upsert({
      where: { key: 'defaultAutoCrawlIntervalDays' },
      update: { value: body.defaultAutoCrawlIntervalDays.toString() },
      create: { key: 'defaultAutoCrawlIntervalDays', value: body.defaultAutoCrawlIntervalDays.toString() },
    });

    return { success: true };
  }

  @Get('projects')
  @Roles('SUPER_ADMIN')
  async getProjects() {
    return this.prisma.project.findMany({
      select: {
        id: true,
        name: true,
        autoCrawlIntervalDays: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          }
        },
        _count: {
          select: { domains: true, products: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('projects/:id')
  @Roles('SUPER_ADMIN')
  async updateProject(@Param('id') id: string, @Body() body: { autoCrawlIntervalDays: number | null }) {
    if (body.autoCrawlIntervalDays !== null && (typeof body.autoCrawlIntervalDays !== 'number' || body.autoCrawlIntervalDays < 0)) {
      throw new HttpException('Invalid autoCrawlIntervalDays', HttpStatus.BAD_REQUEST);
    }
    return this.prisma.project.update({
      where: { id },
      data: { autoCrawlIntervalDays: body.autoCrawlIntervalDays },
    });
  }
}
