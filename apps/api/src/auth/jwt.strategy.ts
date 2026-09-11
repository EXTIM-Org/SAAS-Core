import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: any) {
    const userId = payload?.sub || payload?.userId || payload?.id;
    if (!userId) {
      throw new UnauthorizedException('Invalid token: missing user identifier');
    }
    const user: any = {
      userId,
      id: userId,
      sub: userId,
      email: payload.email,
      role: payload.role,
    };
    if (payload.impersonatorId) {
      user.impersonatorId = payload.impersonatorId;
    }
    return user;
  }
}
