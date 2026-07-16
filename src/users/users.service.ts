import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(email: string, passwordHash: string, role: Role = Role.MEMBER) {
    return this.prisma.user.create({
      data: { email, passwordHash, role },
    });
  }

  async updateRole(id: string, role: Role, actingUserId: string) {
    if (id === actingUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    return { id: updated.id, email: updated.email, role: updated.role };
  }
}
