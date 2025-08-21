const request = require('supertest');
const app = require('../index');
const db = require('../db');
const helpers = require('../helpers');

let adminAgent;

// Test permissions and roles
describe('Workday API - Workday permissions', () => {
  it('should not update workday without authentication', async () => {
    const res = await request(app)
      .post('/api/workday/updateWorkday')
      .send({ date: '2023-01-01', entry_time: '09:00', exit_time: '17:00', notes: 'Worked on project X' });
    expect(res.statusCode).toBe(401);
  });

  it('should not delete workday without authentication', async () => {
    const res = await request(app)
      .post('/api/workday//deleteWorkday')
      .send({ date: '2023-01-01' });
    expect(res.statusCode).toBe(401);
  });

  it('should not list workdays without authentication', async () => {
    const res = await request(app)
      .get('/api/workday/listMonth');
    expect(res.statusCode).toBe(401);
  });

  it('should not list user month without authentication', async () => {
    const res = await request(app)
      .get('/api/workday/listMonth')
      .query({ userId: '1', month: '2023-01' });
    expect(res.statusCode).toBe(401);
  });

  it('should not list other user month while being a member', async () => {

    // Add users to db
    const hashed = await helpers.hashPassword('password123')
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Test1', 'test1@example.com', hashed, 'member']
    );

    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Test2', 'test2@example.com', hashed, 'member']
    );

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'test1@example.com', password: 'password123' });

    await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', loginRes.headers['set-cookie'])
      .send({ date: '2023-01-01', entry_time: '09:00', exit_time: '17:00', notes: 'Worked on project X' });
    
    await request(app).post('/api/user/logout');

    const loginRes1 = await request(app)
      .post('/api/user/login')
      .send({ email: 'test2@example.com', password: 'password123' });

    const res = await request(app)
      .get('/api/workday/listMonth')
      .set('Cookie', loginRes1.headers['set-cookie'])
      .query({ userId: '1', month: '2023-01' });
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);
  });

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE break RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE workday RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  });
});

describe('Workday API - Break permissions', () => {
  it('should not insert break without authentication', async () => {
    const res = await request(app)
      .post('/api/workday/insertBreak')
      .send({ workdayId: '1', start_time: '12:00', end_time: '12:30' });
    expect(res.statusCode).toBe(401);
  });

  it('should not update break without authentication', async () => {
    const res = await request(app)
      .post('/api/workday/updateBreak')
      .send({ workdayId: '1', start_time: '12:00', end_time: '12:30' });
    expect(res.statusCode).toBe(401);
  });

  it('should not delete break without authentication', async () => {
    const res = await request(app)
      .post('/api/workday/deleteBreak')
      .send({ id: '1' });
    expect(res.statusCode).toBe(401);
  });

  it('should not list breaks without authentication', async () => {
    const res = await request(app)
      .get('/api/workday/listBreaks')
      .query({ workdayId: '1' });
    expect(res.statusCode).toBe(401);
  });

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE break RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE workday RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  });
});

// General tests
describe('Workday API - General', () => {
  let cookie;

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE break RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE workday RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    // Add admin user to db
    const hashed = await helpers.hashPassword('password123')
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Test1', 'test2@example.com', hashed, 'member']
    );

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'test2@example.com', password: 'password123' });

    cookie = loginRes.headers['set-cookie'];
  });

  it('should insert workday', async () => {
    const res = await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', cookie)
      .send({ date: '2023-01-01', entry_time: '09:00', exit_time: '17:00', notes: 'Worked on project X' });

    expect(res.statusCode).toBe(200);
    expect(res.body.entry_time).toBe('09:00:00');
  });

  it('should update workday', async () => {
    await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', cookie)
      .send({ date: '2023-01-01', entry_time: '09:00', exit_time: '17:00', notes: 'Worked on project X' });
    
    const res = await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', cookie)
      .send({ date: '2023-01-01', entry_time: '10:00', exit_time: '16:00', notes: 'Worked on project X' });

    expect(res.statusCode).toBe(200); 
    expect(res.body.entry_time).toBe('10:00:00');
    expect(res.body.exit_time).toBe('16:00:00');
  });

  it('should delete workday', async () => {
    await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', cookie)
      .send({ date: '2023-01-01', entry_time: '09:00', exit_time: '17:00', notes: 'Worked on project X' });

    const res = await request(app)
      .post('/api/workday//deleteWorkday')
      .set('Cookie', cookie)
      .send({ date: '2023-01-01' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Workday deleted successfully');
  });

  it('should list workdays for a month', async () => {
    await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', cookie)
      .send({ date: '2023-01-01', entry_time: '09:00', exit_time: '17:00', notes: 'Worked on project X' });

    const res = await request(app)
      .get('/api/workday/listMonth')
      .set('Cookie', cookie)
      .query({ month: '2023-01' });

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].entry_time).toBe('09:00:00');
  });

  it('should list user month workdays', async () => {
    // Set admin role for user
    await db.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['admin', '1']
    );

    // Login again to get the updated cookie
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'test2@example.com', password: 'password123' });

    cookie = loginRes.headers['set-cookie'];

    // Simulate another user
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Test2', 'test3@example.com', 'hashedpassword', 'member']
    );
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [2, '2023-01-01', '09:00', '17:00', 'Worked on project Y']
    );

    const res = await request(app)
      .get('/api/workday/listMonth')
      .set('Cookie', cookie)
      .query({ userId: '2', month: '2023-01' });


    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].entry_time).toBe('09:00:00');
  });

  it('should insert break', async () => {
    // Insert a workday first
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-01-01', '09:00', '17:00', 'Worked on project X']
    );

    const res = await request(app)
      .post('/api/workday/insertBreak')
      .set('Cookie', cookie)
      .send({ workdayId: '1', start_time: '12:00', end_time: '12:30' });

    expect(res.statusCode).toBe(200);
    expect(res.body.start_time).toBe('12:00:00');
  });

  it('should update break', async () => {
    // Insert a workday first
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-01-01', '09:00', '17:00', 'Worked on project X']
    );
    
    await request(app)
      .post('/api/workday/insertBreak')
      .set('Cookie', cookie)
      .send({ workdayId: '1', start_time: '12:00', end_time: '12:30' });

    const res = await request(app)
      .post('/api/workday/updateBreak')
      .set('Cookie', cookie)
      .send({ id: '1', start_time: '12:15', end_time: '12:45' });

    expect(res.statusCode).toBe(200);
    expect(res.body.start_time).toBe('12:15:00');
    expect(res.body.end_time).toBe('12:45:00');
  });

  it('should delete break', async () => {
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-01-01', '09:00', '17:00', 'Worked on project X']
    );

    await request(app)
      .post('/api/workday/insertBreak')
      .set('Cookie', cookie)
      .send({ workdayId: '1', start_time: '12:00', end_time: '12:30' });

    const res = await request(app)
      .post('/api/workday/deleteBreak')
      .set('Cookie', cookie)
      .send({ id: '1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Break deleted successfully');
  });

  it('should provide workday with breaks', async () => {

    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-01-01', '09:00', '17:00', 'Worked on project X']
    );

    await request(app)
      .post('/api/workday/insertBreak')
      .set('Cookie', cookie)
      .send({ workdayId: '1', start_time: '12:00', end_time: '12:30' });

    await request(app)
      .post('/api/workday/insertBreak')
      .set('Cookie', cookie)
      .send({ workdayId: '1', start_time: '11:00', end_time: '12:00' });

    const res = await request(app)
      .get('/api/workday/listMonth')
      .set('Cookie', cookie)
      .query({ month: '2023-01' });

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].breaks[0].start_time).toBe('11:00:00');
    expect(res.body[0].breaks[1].start_time).toBe('12:00:00');

  });

  it('should list breaks for a workday', async () => {
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-01-01', '09:00', '17:00', 'Worked on project X']
    );

    await request(app)
      .post('/api/workday/insertBreak')
      .set('Cookie', cookie)
      .send({ workdayId: '1', start_time: '12:00', end_time: '12:30' });

    const res = await request(app)
      .get('/api/workday/listBreaks')
      .set('Cookie', cookie)
      .query({ workdayId: '1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.breaks[0].start_time).toBe('12:00:00');
  });

  it('should calculate the hours worked for a member', async () => {

    // This first one should not count
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-01-01', '00:00', '01:00', 'Worked on project X']
    );

    // Insert 2 workdays in the first month with 1 hour worked each
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-09-01', '00:00', '01:00', 'Worked on project X']
    );

    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2023-09-02', '00:00', '01:00', 'Worked on project X']
    );

    // Insert 1 workday in a random month with 1 hour worked
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2024-02-01', '00:00', '01:00', 'Worked on project X']
    );

    // Insert 3 workdays in the last month
    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2024-08-31', '00:00', '01:30', 'Worked on project X']
    );

    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2024-08-30', '00:00', '01:15', 'Worked on project X']
    );

    await db.query(
      'INSERT INTO workday (user_id, date, entry_time, exit_time, notes) VALUES ($1, $2, $3, $4, $5)',
      [1, '2024-08-02', '00:00', '01:00', 'Worked on project X']
    );

    const res = await request(app)
      .get('/api/workday/listWorkedHours')
      .set('Cookie', cookie)
      .query({ userId: '1', schoolYear: '2023-2024' });

    console.log(res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(3); // 3 months
    expect(res.body[0].total_hours).toBe(2); // 2 hours in September
  });

});

describe('Workday API - Admin', () => {
  let cookie;

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE break RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE workday RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    // Add admin user to db
    const hashed = await helpers.hashPassword('password123')
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Test1', 'test2@example.com', hashed, 'admin']
    );

    // Add dummy user
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Test1', 'test@example.com', 'pass', 'member']
    );

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'test2@example.com', password: 'password123' });

    cookie = loginRes.headers['set-cookie'];
  });

  it('should insert workday for user as admin', async () => {
    const res = await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', cookie)
      .send({
        userId: '2',
        date: '2023-01-01',
        entry_time: '09:00',
        exit_time: '17:00',
        notes: 'Worked on project Y'
      });

    expect(res.statusCode).toBe(200);

    const workday = await db.query('SELECT * FROM workday;');
    expect(workday.rows.length).toBe(1);
    expect(workday.rows[0].user_id).toBe(2);
  });

  it('should delete workday for user as admin', async () => {
    await request(app)
      .post('/api/workday/updateWorkday')
      .set('Cookie', cookie)
      .send({
        userId: '2',
        date: '2023-01-01',
        entry_time: '09:00',
        exit_time: '17:00',
        notes: 'Worked on project Y'
      });

    const res = await request(app)
      .post('/api/workday/deleteWorkday')
      .set('Cookie', cookie)
      .send({ userId: '2', date: '2023-01-01' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Workday deleted successfully');

    const workday = await db.query('SELECT * FROM workday;');
    expect(workday.rows.length).toBe(0);
  });

});
