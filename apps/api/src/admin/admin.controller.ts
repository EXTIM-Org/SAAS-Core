import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

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
    const [totalUsers, totalProjects, totalOrders, revenueResult] = await Promise.all([
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
}
