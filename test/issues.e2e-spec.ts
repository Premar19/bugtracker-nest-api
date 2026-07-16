import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Projects & Issues (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let accessToken: string;
  let projectId: string;

  const email = `issues-e2e-${Date.now()}@example.com`;
  const password = 'correct-horse-battery-staple';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    server = app.getHttpServer();

    const registerRes = await request(server).post('/auth/register').send({ email, password });
    accessToken = registerRes.body.accessToken;

    const projectRes = await request(server)
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'E2E Project' });
    projectId = projectRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates issues in a project', async () => {
    await request(server)
      .post(`/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Critical bug', priority: 'HIGH' })
      .expect(201);

    await request(server)
      .post(`/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Minor bug', priority: 'LOW' })
      .expect(201);
  });

  it('lists issues in a project with default pagination', async () => {
    const res = await request(server)
      .get(`/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 20, total: 2 });
  });

  it('filters issues by priority', async () => {
    const res = await request(server)
      .get(`/projects/${projectId}/issues`)
      .query({ priority: 'HIGH' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ title: 'Critical bug', priority: 'HIGH' });
  });

  it('paginates issues', async () => {
    const res = await request(server)
      .get(`/projects/${projectId}/issues`)
      .query({ page: 1, limit: 1 })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, pageCount: 2 });
  });

  it('updates an issue status', async () => {
    const listRes = await request(server)
      .get(`/projects/${projectId}/issues`)
      .query({ priority: 'HIGH' })
      .set('Authorization', `Bearer ${accessToken}`);
    const issueId = listRes.body.data[0].id;

    const res = await request(server)
      .patch(`/projects/${projectId}/issues/${issueId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('returns 404 for an issue in a non-existent project', () => {
    return request(server)
      .get('/projects/00000000-0000-0000-0000-000000000000/issues')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('blocks issue creation without a token', () => {
    return request(server)
      .post(`/projects/${projectId}/issues`)
      .send({ title: 'No auth' })
      .expect(401);
  });
});
