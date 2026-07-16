import { Role, IssueStatus, IssuePriority } from './../generated/prisma/enums';

/**
 * Supertest types `res.body` as `any`. Casting it to these shapes keeps the
 * specs under the same strict-TypeScript rules as `src/`, and means a change to
 * a response shape breaks the tests at compile time rather than at assertion time.
 */

export interface AuthResponseBody {
  accessToken: string;
  user: { id: string; email: string; role: Role; passwordHash?: never };
}

export interface UserResponseBody {
  id: string;
  email: string;
  role: Role;
}

export interface ProjectResponseBody {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
}

export interface IssueResponseBody {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: string;
  assigneeId: string | null;
}

export interface PaginatedIssuesBody {
  data: IssueResponseBody[];
  meta: { page: number; limit: number; total: number; pageCount: number };
}
