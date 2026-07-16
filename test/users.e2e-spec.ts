import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { Role } from './../generated/prisma/enums';
import { AuthResponseBody, UserResponseBody } from './types';

describe('Users roles (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const password = 'correct-horse-battery-staple';
  const adminEmail = `admin-e2e-${Date.now()}@example.com`;
  const memberEmail = `member-e2e-${Date.now()}@example.com`;

  let adminToken: string;
  let adminId: string;
  let memberToken: string;
  let memberId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: adminEmail, password })
      .expect(201);
    adminId = (adminRes.body as AuthResponseBody).user.id;

    const memberRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: memberEmail, password })
      .expect(201);
    const memberBody = memberRes.body as AuthResponseBody;
    memberId = memberBody.user.id;
    memberToken = memberBody.accessToken;

    // Promote directly, the same way `npm run seed` bootstraps the first admin.
    await prisma.user.update({
      where: { id: adminId },
      data: { role: Role.ADMIN },
    });

    // Re-login so the token carries the ADMIN role in its payload.
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = (adminLogin.body as AuthResponseBody).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an unauthenticated role change', () => {
    return request(app.getHttpServer())
      .patch(`/users/${memberId}/role`)
      .send({ role: Role.ADMIN })
      .expect(401);
  });

  it('forbids a member from promoting themselves', () => {
    return request(app.getHttpServer())
      .patch(`/users/${memberId}/role`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ role: Role.ADMIN })
      .expect(403);
  });

  it('rejects an invalid role value', () => {
    return request(app.getHttpServer())
      .patch(`/users/${memberId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'SUPERUSER' })
      .expect(400);
  });

  it('stops an admin from changing their own role', () => {
    return request(app.getHttpServer())
      .patch(`/users/${adminId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.MEMBER })
      .expect(400);
  });

  it('returns 404 for an unknown user', () => {
    return request(app.getHttpServer())
      .patch('/users/00000000-0000-0000-0000-000000000000/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.ADMIN })
      .expect(404);
  });

  it('lets an admin promote a member', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${memberId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.ADMIN })
      .expect(200);

    expect(res.body as UserResponseBody).toEqual({
      id: memberId,
      email: memberEmail,
      role: Role.ADMIN,
    });
  });

  it('lets an admin demote a member back', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${memberId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.MEMBER })
      .expect(200);

    expect((res.body as UserResponseBody).role).toBe(Role.MEMBER);
  });
});
