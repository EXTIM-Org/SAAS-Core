import { Test, TestingModule } from '@nestjs/testing';
import { CoreApiClientService } from './core-api-client.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

describe('CoreApiClientService', () => {
  let service: CoreApiClientService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreApiClientService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:4000'),
          },
        },
      ],
    }).compile();

    service = module.get<CoreApiClientService>(CoreApiClientService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should return true when API call succeeds', async () => {
    jest.spyOn(httpService, 'get').mockReturnValue(
      of({
        data: { valid: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as import('axios').AxiosRequestHeaders,
        } as import('axios').InternalAxiosRequestConfig,
      }),
    );

    const result = await service.validateProject('valid-id', 'Bearer token');
    expect(result).toBe(true);
    expect(httpService.get).toHaveBeenCalledWith(
      'http://localhost:4000/projects/valid-id',
      {
        headers: { Authorization: 'Bearer token' },
      },
    );
  });

  it('should return false when API call fails', async () => {
    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(throwError(() => new Error('Request failed')));

    const result = await service.validateProject('invalid-id');
    expect(result).toBe(false);
    expect(httpService.get).toHaveBeenCalledWith(
      'http://localhost:4000/projects/invalid-id',
      {
        headers: {},
      },
    );
  });
});
