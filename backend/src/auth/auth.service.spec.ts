import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { EmailService } from '../common/email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let emailService: jest.Mocked<Partial<EmailService>>;

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    name: 'Test User',
    role: UserRole.BIDDER,
    isEmailVerified: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    emailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUser.email, mockUser.name);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should throw ConflictException when email already exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: loginDto.email } });
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (userRepository.findOne as jest.Mock).mockResolvedValue(inactiveUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email when user is found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id }, { expiresIn: '1h' });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      // Never leak the token in the response (S2).
      expect(result).toEqual({ success: true, message: expect.any(String) });
      expect(result).not.toHaveProperty('resetToken');
    });

    it('responds identically when the user is not found (no enumeration)', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result).not.toHaveProperty('resetToken');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('sendOtp', () => {
    it('should generate and store OTP for existing user', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.sendOtp('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(userRepository.save).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalled();
      expect(result.success).toBe(true);
      // Test env is not 'production', so the dev echo is present (never in prod).
      expect(result.devOtp).toMatch(/^\d{6}$/);
      expect(result).not.toHaveProperty('otp');
    });

    it('responds identically when the user is not found (no enumeration)', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.sendOtp('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result).not.toHaveProperty('otp');
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid OTP successfully', async () => {
      const validOtp = '123456';
      const userWithOtp = {
        ...mockUser,
        otpCode: validOtp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      };
      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithOtp);
      (userRepository.save as jest.Mock).mockResolvedValue(userWithOtp);

      const result = await service.verifyOtp('test@example.com', validOtp);

      expect(userRepository.save).toHaveBeenCalled();
      expect(result.user).toBeDefined();
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      const userWithOtp = {
        ...mockUser,
        otpCode: '654321',
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      };
      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithOtp);

      await expect(service.verifyOtp('test@example.com', '000000')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired OTP', async () => {
      const userWithOtp = {
        ...mockUser,
        otpCode: '123456',
        otpExpiry: new Date(Date.now() - 10 * 60 * 1000),
      };
      (userRepository.findOne as jest.Mock).mockResolvedValue(userWithOtp);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.changePassword('user-1', 'currentPass', 'newPass123');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.changePassword('user-1', 'wrongPass', 'newPass123')).rejects.toThrow(UnauthorizedException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.changePassword('user-1', 'currentPass', 'newPass123')).rejects.toThrow(BadRequestException);
    });
  });
});
