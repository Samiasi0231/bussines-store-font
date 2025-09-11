import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { StatusRepository } from '../repositories/status.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../entities/user.entity';
import { StatusType } from '../entities/status.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailerService } from '../mailer/mailer.service';
import { UUID } from 'crypto';
import { SendEmailDto } from '../mailer/dto/send-mail.dto';
import { renderFile } from 'ejs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly statusRepository: StatusRepository,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const activeStatus = await this.statusRepository.findOne({
      where: { name: StatusType.PENDING },
    });

    if (!activeStatus) {
      throw new Error('Active status not found');
    }

    const userData = {
      ...registerDto,
      password: hashedPassword,
      status: activeStatus,
    };

    const user = await this.userRepository.createStrict(userData);

    const emailData: SendEmailDto = {
      recipients: [{ name: user.firstName, address: user.email }],
      subject: 'Your OTP Code',
      html: ``,
    };

    const context = {
      name: user.firstName,
      otp: crypto.randomBytes(3).toString('hex'),
    };

    emailData.html = await renderFile('src/emails/OTP.ejs', context);

    await this.mailerService.sendEmail(emailData);

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.findbyIdAndUpdate(user.id, {
      lastLoggedInAt: new Date(),
    });

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'otherName',
        'emailVerified',
        'lastLoggedInAt',
      ],
      relations: ['status'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async getProfile(userId: UUID): Promise<User> {
    const user = await this.userRepository.findById(userId);
    return user;
  }
}
