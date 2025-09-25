import { Controller, Post, Body, UseGuards, Get, Request, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    const { password, ...userWithoutPassword } = req.user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.authService.updateProfile(req.user.id, updateProfileDto);
    const { password, ...userWithoutPassword } = updatedUser;
    return {
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-only')
  adminOnly(@Request() req: any) {
    const { password, ...userWithoutPassword } = req.user;
    return {
      message: 'This is an admin-only endpoint',
      user: userWithoutPassword,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('user-or-admin')
  userOrAdmin(@Request() req: any) {
    const { password, ...userWithoutPassword } = req.user;
    return {
      message: 'This endpoint is accessible to both users and admins',
      user: userWithoutPassword,
    };
  }
}
