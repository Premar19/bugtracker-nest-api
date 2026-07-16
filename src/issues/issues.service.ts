import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { QueryIssuesDto } from './dto/query-issues.dto';

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async assertAssigneeExists(assigneeId: string) {
    const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }
  }

  async create(projectId: string, dto: CreateIssueDto) {
    await this.assertProjectExists(projectId);
    if (dto.assigneeId) {
      await this.assertAssigneeExists(dto.assigneeId);
    }

    return this.prisma.issue.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        projectId,
      },
    });
  }

  async findAll(projectId: string, query: QueryIssuesDto) {
    await this.assertProjectExists(projectId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.IssueWhereInput = {
      projectId,
      status: query.status,
      priority: query.priority,
    };

    const [data, total] = await Promise.all([
      this.prisma.issue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.issue.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pageCount: Math.ceil(total / limit) } };
  }

  async findOne(projectId: string, id: string) {
    const issue = await this.prisma.issue.findFirst({ where: { id, projectId } });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    return issue;
  }

  async update(projectId: string, id: string, dto: UpdateIssueDto) {
    await this.findOne(projectId, id);
    if (dto.assigneeId) {
      await this.assertAssigneeExists(dto.assigneeId);
    }

    return this.prisma.issue.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
      },
    });
  }

  async remove(projectId: string, id: string) {
    await this.findOne(projectId, id);
    await this.prisma.issue.delete({ where: { id } });
  }
}
