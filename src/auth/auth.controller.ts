import { Controller, Post, Body, UseGuards, Get, Request, Put, Patch, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto, UpdateProfileDto, AdminUpdateUserDto, AdminCreateUserDto, BulkDeleteUsersDto, BulkDeleteResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account suspended' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req: any) {
    const { password, ...userWithoutPassword } = req.user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin only endpoint' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User or Admin endpoint' })
  @ApiResponse({ status: 200, description: 'Access granted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  userOrAdmin(@Request() req: any) {
    const { password, ...userWithoutPassword } = req.user;
    return {
      message: 'This endpoint is accessible to both users and admins',
      user: userWithoutPassword,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllUsers() {
    const users = await this.authService.findAllUsers();
    return {
      message: 'Users retrieved successfully',
      users,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('users')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createUserByAdmin(@Body() createUserDto: AdminCreateUserDto) {
    const user = await this.authService.createUserByAdmin(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'User created successfully by admin',
      user: userWithoutPassword,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user by admin' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateUserByAdmin(
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateUserDto: AdminUpdateUserDto
  ) {
    const updatedUser = await this.authService.updateUserByAdmin(userId, updateUserDto);
    const { password, ...userWithoutPassword } = updatedUser;
    return {
      message: 'User updated successfully',
      user: userWithoutPassword,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('users/bulk')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk delete users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk delete operation completed', type: BulkDeleteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async bulkDeleteUsers(@Body() bulkDeleteDto: BulkDeleteUsersDto): Promise<BulkDeleteResponseDto> {
    return this.authService.bulkDeleteUsers(bulkDeleteDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('users/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user by admin' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUserByAdmin(@Param('id', ParseIntPipe) userId: number) {
    await this.authService.deleteUserByAdmin(userId);
    return {
      message: 'User deleted successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('users/:id/data')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user and all related data (Admin only)' })
  @ApiResponse({ status: 200, description: 'User and all related data deleted successfully', type: BulkDeleteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUserData(@Param('id', ParseIntPipe) userId: number): Promise<BulkDeleteResponseDto> {
    return this.authService.deleteUserData(userId);
  }
}
