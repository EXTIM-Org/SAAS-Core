import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from '@saas/database';

@Injectable()
export class UsersService {
  // Temporary in-memory map to store password hashes since the database schema currently lacks a password field
  private passwordHashes = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    // Hash the password, but strictly pass only email to Prisma per current database schema
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store hash in memory
    this.passwordHashes.set(email, hashedPassword);

    try {
      return await this.prisma.user.create({
        data: {
          email,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  getPasswordHash(email: string): string | undefined {
    return this.passwordHashes.get(email);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
