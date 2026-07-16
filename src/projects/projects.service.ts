import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/enums';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { name: dto.name, description: dto.description, ownerId },
    });
  }

  findAllForUser(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(id: string, user: JwtPayload) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    this.assertOwnerOrAdmin(project.ownerId, user);
    return project;
  }

  async update(id: string, user: JwtPayload, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    this.assertOwnerOrAdmin(project.ownerId, user);

    return this.prisma.project.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(id: string, user: JwtPayload) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    this.assertOwnerOrAdmin(project.ownerId, user);

    await this.prisma.project.delete({ where: { id } });
  }

  private assertOwnerOrAdmin(ownerId: string, user: JwtPayload) {
    if (user.role !== Role.ADMIN && user.sub !== ownerId) {
      throw new ForbiddenException('Only the project owner or an admin can perform this action');
    }
  }
}
