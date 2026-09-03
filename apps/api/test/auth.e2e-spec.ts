import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    full_name: 'مستخدم تجريبي',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.full_name).toBe(testUser.full_name);
          expect(res.body.user).not.toHaveProperty('password_hash');
          accessToken = res.body.accessToken;
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'bad', password: '123' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should return 200 with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).not.toHaveProperty('password_hash');
        });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
