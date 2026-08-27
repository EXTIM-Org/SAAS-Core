import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { LoginResponse, UserPayload } from '@saas/shared';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g. invalid data, user exists).',
  })
  async signup(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.signup(authCredentialsDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged in, returns access token.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGci...' },
        access_token: { type: 'string', example: 'eyJhbGci...' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<LoginResponse> {
    return this.authService.login(authCredentialsDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@CurrentUser() user: UserPayload & { email: string }) {
    return user;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 201,
    description: 'Returns new access and refresh tokens.',
  })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  @ApiResponse({ status: 201, description: 'User successfully logged out.' })
  async logout(@CurrentUser() user: UserPayload) {
    await this.authService.logout(user.userId || (user as any).sub);
    return { success: true };
  }
}
