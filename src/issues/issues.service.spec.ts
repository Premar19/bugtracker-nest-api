import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IssuesService } from './issues.service';
import { PrismaService } from '../prisma/prisma.service';

type MockPrisma = {
  project: { findUnique: jest.Mock };
  user: { findUnique: jest.Mock };
  issue: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('IssuesService', () => {
  let service: IssuesService;
  let prisma: MockPrisma;

  const projectId = 'project-1';
  const issueId = 'issue-1';

  beforeEach(async () => {
    prisma = {
      project: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      issue: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [IssuesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(IssuesService);
  });

  describe('create', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.create(projectId, { title: 'Bug' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.issue.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the assignee does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: projectId });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(projectId, { title: 'Bug', assigneeId: 'missing-user' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.issue.create).not.toHaveBeenCalled();
    });

    it('creates the issue when the project and assignee exist', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: projectId });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.issue.create.mockResolvedValue({ id: issueId, title: 'Bug', projectId });

      const result = await service.create(projectId, { title: 'Bug', assigneeId: 'user-1' });

      expect(result).toEqual({ id: issueId, title: 'Bug', projectId });
      expect(prisma.issue.create).toHaveBeenCalledWith({
        data: {
          title: 'Bug',
          description: undefined,
          priority: undefined,
          assigneeId: 'user-1',
          projectId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('applies status/priority filters and pagination', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: projectId });
      prisma.issue.findMany.mockResolvedValue([{ id: issueId }]);
      prisma.issue.count.mockResolvedValue(1);

      const result = await service.findAll(projectId, {
        status: 'OPEN' as any,
        priority: 'HIGH' as any,
        page: 2,
        limit: 5,
      });

      expect(prisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId, status: 'OPEN', priority: 'HIGH' },
          skip: 5,
          take: 5,
        }),
      );
      expect(result).toEqual({
        data: [{ id: issueId }],
        meta: { page: 2, limit: 5, total: 1, pageCount: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the issue is not in the project', async () => {
      prisma.issue.findFirst.mockResolvedValue(null);

      await expect(service.findOne(projectId, issueId)).rejects.toThrow(NotFoundException);
    });

    it('returns the issue when found', async () => {
      prisma.issue.findFirst.mockResolvedValue({ id: issueId, projectId });

      await expect(service.findOne(projectId, issueId)).resolves.toEqual({
        id: issueId,
        projectId,
      });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException instead of deleting when the issue is missing', async () => {
      prisma.issue.findFirst.mockResolvedValue(null);

      await expect(service.remove(projectId, issueId)).rejects.toThrow(NotFoundException);
      expect(prisma.issue.delete).not.toHaveBeenCalled();
    });

    it('deletes the issue when it exists', async () => {
      prisma.issue.findFirst.mockResolvedValue({ id: issueId, projectId });
      prisma.issue.delete.mockResolvedValue({ id: issueId });

      await service.remove(projectId, issueId);

      expect(prisma.issue.delete).toHaveBeenCalledWith({ where: { id: issueId } });
    });
  });
});
