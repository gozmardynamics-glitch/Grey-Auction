import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../common/email/email.module';

// Fail fast instead of silently signing with a known secret (S4).
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}
const effectiveJwtSecret = jwtSecret || 'dev-secret';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: effectiveJwtSecret,
      // @nestjs/jwt 11 types expiresIn as ms.StringValue (not plain string).
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION || '24h') as any },
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}