import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: (req) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return null;
        }
        
        const token = authHeader.substring(7);
        return token;
      },
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
    console.log('JWT Secret being used:', process.env.JWT_SECRET || 'your-secret-key');
  }

  async validate(payload: any): Promise<User> {
    
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    
    const user = await this.authService.validateUserById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return user;
  }
}
