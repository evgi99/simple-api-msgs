import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

describe('App (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
  });

  afterAll(async () => {
    await mongo?.stop();
    delete process.env.MONGODB_URI;
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET) returns 200', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res: { body: { status: string } }) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('register -> login -> create message -> get messages flow', async () => {
    const server = request(app.getHttpServer());

    const registerRes = await server
      .post('/api/auth/register')
      .send({ email: 'alice@test.com', password: 'password123' })
      .expect(201);
    expect(registerRes.body.access_token).toBeDefined();
    expect(registerRes.body.user.email).toBe('alice@test.com');
    const aliceToken = registerRes.body.access_token;

    const registerBob = await server
      .post('/api/auth/register')
      .send({ email: 'bob@test.com', password: 'password123' })
      .expect(201);
    const bobToken = registerBob.body.access_token;

    const createMsg = await server
      .post('/api/messages')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        receiverId: registerBob.body.user.id,
        subject: 'Hello',
        body: 'Hi Bob',
      })
      .expect(201);
    expect(createMsg.body.subject).toBe('Hello');
    expect(createMsg.body.body).toBe('Hi Bob');

    const unreadBob = await server
      .get('/api/messages/unread')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);
    expect(Array.isArray(unreadBob.body)).toBe(true);
    expect(unreadBob.body.length).toBe(1);
    expect(unreadBob.body[0].subject).toBe('Hello');

    const readMsg = await server
      .get(`/api/messages/${createMsg.body._id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);
    expect(readMsg.body.readAt).toBeDefined();

    const allBob = await server
      .get('/api/messages')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);
    expect(allBob.body.length).toBe(1);

    await server
      .delete(`/api/messages/${createMsg.body._id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    const unreadAfterDelete = await server
      .get('/api/messages/unread')
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);
    expect(unreadAfterDelete.body.length).toBe(0);
  });

  it('GET /api/messages without Authorization returns 401', () => {
    return request(app.getHttpServer())
      .get('/api/messages')
      .expect(401);
  });

  it('GET /api/messages/:id as non-participant returns 403', async () => {
    const server = request(app.getHttpServer());

    const aliceRes = await server
      .post('/api/auth/register')
      .send({ email: 'alice403@test.com', password: 'password123' })
      .expect(201);
    const bobRes = await server
      .post('/api/auth/register')
      .send({ email: 'bob403@test.com', password: 'password123' })
      .expect(201);
    const carolRes = await server
      .post('/api/auth/register')
      .send({ email: 'carol403@test.com', password: 'password123' })
      .expect(201);

    const createRes = await server
      .post('/api/messages')
      .set('Authorization', `Bearer ${aliceRes.body.access_token}`)
      .send({
        receiverId: bobRes.body.user.id,
        subject: 'Private',
        body: 'For Bob only',
      })
      .expect(201);

    await server
      .get(`/api/messages/${createRes.body._id}`)
      .set('Authorization', `Bearer ${carolRes.body.access_token}`)
      .expect(403);
  });

  it('POST /api/auth/register with existing email returns 409', async () => {
    const server = request(app.getHttpServer());

    await server
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' })
      .expect(201);

    const res = await server
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'otherpass456' })
      .expect(409);

    expect(res.body.message).toBeDefined();
  });

  it('GET /api/messages/:id with invalid id returns 404', async () => {
    const server = request(app.getHttpServer());
    const registerRes = await server
      .post('/api/auth/register')
      .send({ email: 'invalid-id@test.com', password: 'password123' })
      .expect(201);

    await server
      .get('/api/messages/not-a-valid-mongo-id')
      .set('Authorization', `Bearer ${registerRes.body.access_token}`)
      .expect(404);
  });

  it('GET /api/auth/admin/test returns 200 and ok status', () => {
    return request(app.getHttpServer())
      .get('/api/auth/admin/test')
      .expect(200)
      .expect((res: { body: { status: string } }) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('GET /api/messages/admin/test returns 200 and ok status', () => {
    return request(app.getHttpServer())
      .get('/api/messages/admin/test')
      .expect(200)
      .expect((res: { body: { status: string } }) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('POST /api/auth/register normalizes email to lowercase', async () => {
    const server = request(app.getHttpServer());

    const res = await server
      .post('/api/auth/register')
      .send({ email: 'Foo@Bar.COM', password: 'password123' })
      .expect(201);

    expect(res.body.user.email).toBe('foo@bar.com');
  });
});
