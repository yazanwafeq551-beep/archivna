import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { CamelToSnakePipe } from '../src/common/pipes/camel-to-snake.pipe';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // Mirror main.ts: without these the fixture cannot see a cookie it was
    // sent, and camelCase request keys reach the DTOs unrenamed.
    app.use(cookieParser());
    app.useGlobalPipes(
      new CamelToSnakePipe(),
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

  /**
   * The refresh token lives in exactly one place per client: an httpOnly
   * cookie for browsers, the response body for clients that carry it
   * themselves. Returning both would put two live copies of a rotating
   * credential in play; returning the body copy to a browser would hand
   * every XSS a seven-day credential instead of a fifteen-minute one.
   */
  describe('session delivery per client', () => {
    const browserUser = {
      full_name: 'مستخدم متصفح',
      email: `browser-${Date.now()}@example.com`,
      password: 'TestPass123!',
    };
    const nativeUser = {
      full_name: 'مستخدم تطبيق',
      email: `native-${Date.now()}@example.com`,
      password: 'TestPass123!',
    };

    /** The refresh cookie from a response, or undefined when none was set. */
    const refreshCookie = (res: request.Response): string | undefined => {
      const header = res.headers['set-cookie'];
      const all = Array.isArray(header) ? header : header ? [header] : [];
      return all.find((c: string) => c.startsWith('refresh_token='));
    };

    it('gives a browser the cookie and nothing in the body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(browserUser)
        .expect(201);

      expect(res.body.refreshToken).toBeUndefined();
      expect(res.body).toHaveProperty('accessToken');
      expect(refreshCookie(res)).toMatch(/HttpOnly/i);
    });

    it('keeps the rotated token out of a browser refresh body', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: browserUser.email, password: browserUser.password })
        .expect(200);
      const cookie = refreshCookie(login);
      expect(cookie).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie as string)
        .expect(200);

      expect(res.body.refreshToken).toBeUndefined();
      expect(res.body).toHaveProperty('accessToken');
      expect(refreshCookie(res)).toBeDefined();
      expect(refreshCookie(res)).not.toBe(cookie);
    });

    it('gives a token-bearing client the body copy and no cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('X-Client', 'native')
        .send(nativeUser)
        .expect(201);

      expect(typeof res.body.refreshToken).toBe('string');
      expect(refreshCookie(res)).toBeUndefined();
    });

    it('rotates a body token and revokes the chain on logout', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Client', 'native')
        .send({ email: nativeUser.email, password: nativeUser.password })
        .expect(200);
      const first = login.body.refreshToken;

      const rotated = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Client', 'native')
        .send({ refreshToken: first })
        .expect(200);
      expect(rotated.body.refreshToken).toBeDefined();
      expect(rotated.body.refreshToken).not.toBe(first);

      // Without a body token logout would be a no-op for this client, and
      // signing out would leave a live token on the device for a week.
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('X-Client', 'native')
        .send({ refreshToken: rotated.body.refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Client', 'native')
        .send({ refreshToken: rotated.body.refreshToken })
        .expect(401);
    });

    it('rejects a refresh that carries no credential at all', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401);
    });
  });
});
