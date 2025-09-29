import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto, UpdateProfileDto, AdminCreateUserDto, BulkDeleteUsersDto, BulkDeleteResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.USER,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload = { email: savedUser.email, sub: savedUser.id, role: savedUser.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      message: 'User created successfully',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
    };
  }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Your account is suspended. Please contact admin.');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async validateUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if email is being updated and if it already exists
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: updateProfileDto.email } 
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update only provided fields
    Object.assign(user, updateProfileDto);
    
    return this.userRepository.save(user);
  }

  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
  }

  async updateUserByAdmin(userId: number, updateData: { firstName?: string; lastName?: string; role?: UserRole; isActive?: boolean }): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update only provided fields
    Object.assign(user, updateData);
    
    return this.userRepository.save(user);
  }

  async deleteUserByAdmin(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete user - cascade will handle related data
    await this.userRepository.remove(user);
  }

  async createUserByAdmin(createUserDto: AdminCreateUserDto): Promise<User> {
    const { email, password, firstName, lastName, role, isActive } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password (use default if not provided)
    const defaultPassword = password || 'defaultPassword123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create new user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.USER,
      isActive: isActive !== undefined ? isActive : true,
    });

    return this.userRepository.save(user);
  }

  async bulkDeleteUsers(bulkDeleteDto: BulkDeleteUsersDto): Promise<BulkDeleteResponseDto> {
    const { userIds } = bulkDeleteDto;
    const deletedIds: number[] = [];
    const failedIds: number[] = [];

    // Use transaction for bulk operations
    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const userId of userIds) {
        try {
          const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
          if (user) {
            await queryRunner.manager.remove(User, user);
            deletedIds.push(userId);
          } else {
            failedIds.push(userId);
          }
        } catch (error) {
          failedIds.push(userId);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return {
      deletedCount: deletedIds.length,
      deletedIds,
      failedIds,
      message: `Bulk delete completed. ${deletedIds.length} users deleted, ${failedIds.length} failed.`,
    };
  }

  async deleteUserData(userId: number): Promise<BulkDeleteResponseDto> {
    const deletedIds: number[] = [];
    const failedIds: number[] = [];

    // Use transaction for cascade deletion
    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete user's books
      const booksResult = await queryRunner.manager.query(
        'DELETE FROM books WHERE "createdBy" = $1',
        [userId]
      );
      
      // Delete user's feedback
      const feedbackResult = await queryRunner.manager.query(
        'DELETE FROM feedbacks WHERE "userId" = $1',
        [userId]
      );

      // Delete the user
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
      if (user) {
        await queryRunner.manager.remove(User, user);
        deletedIds.push(userId);
      } else {
        failedIds.push(userId);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return {
      deletedCount: deletedIds.length,
      deletedIds,
      failedIds,
      message: `User data deletion completed. User and all related data deleted.`,
    };
  }

}
