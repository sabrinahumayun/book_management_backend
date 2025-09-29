import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean, IsArray, ArrayNotEmpty, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (minimum 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER, description: 'User role (defaults to USER)' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ example: 'Login successful', description: 'Response message' })
  message: string;

  @ApiProperty({
    example: {
      id: 1,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user'
    },
    description: 'User information'
  })
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER, description: 'User role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'User active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminCreateUserDto {
  @ApiProperty({ example: 'jane.doe@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'password123', description: 'User password (minimum 6 characters). If not provided, defaults to "defaultPassword123"', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Jane', description: 'User first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER, description: 'User role (defaults to USER)' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'User active status (defaults to true)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkDeleteUsersDto {
  @ApiProperty({ 
    example: [1, 2, 3], 
    description: 'Array of user IDs to delete',
    type: [Number]
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  userIds: number[];
}

export class BulkDeleteResponseDto {
  @ApiProperty({ example: 3, description: 'Number of items successfully deleted' })
  deletedCount: number;

  @ApiProperty({ example: [1, 2, 3], description: 'Array of successfully deleted IDs' })
  deletedIds: number[];

  @ApiProperty({ example: [], description: 'Array of IDs that failed to delete' })
  failedIds: number[];

  @ApiProperty({ example: 'Bulk delete operation completed', description: 'Operation result message' })
  message: string;
}
