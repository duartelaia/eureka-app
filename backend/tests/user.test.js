const request = require('supertest');
const app = require('../index');
const db = require('../db');
const helpers = require('../helpers');

beforeEach(async () => {
  await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

  // Add admin user to db
  const hashed = await helpers.hashPassword('password123')
  await db.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
    ['Admin', 'admin@example.com', hashed, 'admin']
  );
});

describe('User API', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.name).toBe('Admin');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test2@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('should register a new user', async () => {
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/user/updateUser')
      .set('Cookie', cookie)
      .send({
        name: 'Test',
        email: 'test@example.com',
        phonenum: '123456789',
        password: 'password123',
        statistics: false,
        enter_time: '14:00',
        leave_time: '18:00',
        role: 'member'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  it('should not register with existing email', async () => {
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    const cookie = loginRes.headers['set-cookie'];

    await request(app)
      .post('/api/user/updateUser')
      .set('Cookie', cookie)
      .send({
        name: 'Test1',
        email: 'test@example.com',
        phonenum: '123456789',
        password: 'password123',
        statistics: false,
        enter_time: '14:00',
        leave_time: '18:00',
        role: 'member'
      });

    const res = await request(app)
      .post('/api/user/updateUser')
      .set('Cookie', cookie)
      .send({
        name: 'Test',
        email: 'test@example.com',
        phonenum: '123456789',
        password: 'password123',
        statistics: false,
        enter_time: '14:00',
        leave_time: '18:00',
        role: 'member'
      });
    expect(res.statusCode).toBe(400);
  });
  
  it('should update user information', async () => {
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/user/updateUser')
      .set('Cookie', cookie)
      .send({
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        phonenum: '987654321',
        password: '',
        statistics: false,
        enter_time: '09:00',
        leave_time: '17:00',
        role: 'admin'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('should update password', async () => {
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    const cookie = loginRes.headers['set-cookie'];

    await request(app)
      .post('/api/user/updateUser')
      .set('Cookie', cookie)
      .send({
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        phonenum: '987654321',
        password: 'newpassword123',
        statistics: false,
        enter_time: '09:00',
        leave_time: '17:00',
        role: 'admin'
      });

    await request(app).post('/api/user/logout');

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'updated@example.com', password: 'newpassword123' });

    expect(res.statusCode).toBe(200);
  });

  it('should not register without being userenticated', async () => {
    const res = await request(app)
      .post('/api/user/updateUser')
      .send({
        name: 'Test',
        email: 'test@example.com',
        phonenum: 123456789,
        password: 'password123',
        statistics: false,
        enter_time: null,
        leave_time: null,
        role: 'member'
      });
    expect(res.statusCode).toBe(401);
  });

  it('should not get profile for unuserenticated user', async () => {
    const res = await request(app)
      .get('/api/user/me');
    expect(res.statusCode).toBe(401);
  });

  it('should list all users', async () => {
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    const cookie = loginRes.headers['set-cookie'];

    await request(app)
      .post('/api/user/updateUser')
      .set('Cookie', cookie)
      .send({
        name: 'Test',
        email: 'test@example.com',
        phonenum: '123456789',
        password: 'password123',
        statistics: true,
        enter_time: '14:00',
        leave_time: '18:00',
        role: 'member'
      });
    
    await request(app)
      .post('/api/user/updateUser')
      .set('Cookie', cookie)
      .send({
        name: 'Test2',
        email: 'test2@example.com',
        phonenum: '123456789',
        password: 'password123',
        statistics: true,
        enter_time: '14:00',
        leave_time: '18:00',
        role: 'member'
      });  

    const res = await request(app)
      .get('/api/user/listUsers')
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    
  });
});