import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { CoreApiClientService } from './core-api-client.service';
import { NotFoundException } from '@nestjs/common';

describe('SearchController', () => {
  let controller: SearchController;
  let coreApiClientService: CoreApiClientService;
  let typesenseClientMock: Record<string, jest.Mock | Record<string, jest.Mock | Record<string, jest.Mock>>>;

  beforeEach(async () => {
    typesenseClientMock = {
      collections: jest.fn().mockReturnValue({
        documents: jest.fn().mockReturnValue({
          search: jest.fn().mockResolvedValue({ hits: [{ document: { id: '1', title: 'Test' } }] }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: CoreApiClientService,
          useValue: {
            validateProject: jest.fn(),
          },
        },
        {
          provide: 'TYPESENSE_CLIENT',
          useValue: typesenseClientMock,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    coreApiClientService = module.get<CoreApiClientService>(CoreApiClientService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should throw NotFoundException if project is invalid', async () => {
      jest.spyOn(coreApiClientService, 'validateProject').mockResolvedValue(false);

      await expect(controller.search('invalid-id', 'test')).rejects.toThrow(NotFoundException);
    });

    it('should return empty hits if query is empty', async () => {
      jest.spyOn(coreApiClientService, 'validateProject').mockResolvedValue(true);

      const result = await controller.search('valid-id', '');
      expect(result).toEqual({ hits: [] });
    });

    it('should call Typesense search if project is valid', async () => {
      jest.spyOn(coreApiClientService, 'validateProject').mockResolvedValue(true);

      const result = await controller.search('valid-id', 'test query', 'Bearer token');

      expect(coreApiClientService.validateProject).toHaveBeenCalledWith('valid-id', 'Bearer token');
      expect(typesenseClientMock.collections).toHaveBeenCalledWith('documents');
      expect(result).toEqual({ hits: [{ document: { id: '1', title: 'Test' } }] });
    });
  });
});
