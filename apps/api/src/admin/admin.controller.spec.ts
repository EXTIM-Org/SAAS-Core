import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminController', () => {
  let controller: AdminController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: { count: jest.fn().mockResolvedValue(10) },
            project: { count: jest.fn().mockResolvedValue(5) },
            order: {
              count: jest.fn().mockResolvedValue(20),
              aggregate: jest
                .fn()
                .mockResolvedValue({ _sum: { totalAmount: 1500 } }),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const stats = await controller.getStats();
      expect(stats).toEqual({
        totalUsers: 10,
        totalProjects: 5,
        totalOrders: 20,
        totalRevenue: 1500,
      });
      expect(prismaService.user.count).toHaveBeenCalled();
      expect(prismaService.project.count).toHaveBeenCalled();
      expect(prismaService.order.count).toHaveBeenCalled();
      expect(prismaService.order.aggregate).toHaveBeenCalledWith({
        _sum: { totalAmount: true },
      });
    });

    it('should handle null revenue', async () => {
      (prismaService.order.aggregate as jest.Mock).mockResolvedValueOnce({
        _sum: { totalAmount: null },
      });
      const stats = await controller.getStats();
      expect(stats.totalRevenue).toBe(0);
    });
  });
});
