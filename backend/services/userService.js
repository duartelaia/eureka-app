const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db.js');
const helpers = require('../helpers.js');

exports.updateUser = async ({
  id,
  name,
  email,
  phonenum,
  password = null,
  statistics = false,
  enter_time = null,
  leave_time = null,
  role = 'member'
}) => {
  const shouldUpdatePassword = password != null;
  const hashed = shouldUpdatePassword ? await helpers.hashPassword(password) : null;
  try {
    let query, params;
    if (id) {
      query = `
        UPDATE users
        SET
          name = $2,
          email = $3,
          phonenum = $4,
          ${shouldUpdatePassword ? "password = $5," : ""}
          statistics = $6,
          enter_time = $7,
          leave_time = $8,
          role = $9,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, phonenum, statistics, enter_time, leave_time, role
      `;
      params = shouldUpdatePassword
        ? [id, name, email, phonenum, hashed, statistics, enter_time, leave_time, role]
        : [id, name, email, phonenum, statistics, enter_time, leave_time, role];
    } else {
      query = `
        INSERT INTO users (name, email, phonenum, password, statistics, enter_time, leave_time, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, email, phonenum, statistics, enter_time, leave_time, role
      `;
      params = [name, email, phonenum, hashed, statistics, enter_time, leave_time, role];
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return { status: 500, data: { error: 'Internal server error' } };
    }
    return { status: 200, data: result.rows[0] };
  } catch (error) {
    if (error.code === '23505') {
      // Duplicate email error
      return { status: 400, data: { error: 'Email already exists' } };
    }
    console.error('Error updating user:', error);
    return { status: 500, data: { error: 'Internal server error' } };
  }
};

exports.login = async ({ email, password }) => {
  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length === 0) {
    return { status: 401, data: { error: 'Invalid credentials' } };
  }

  const match = await bcrypt.compare(password, user.rows[0].password);
  if (!match) {
    return { status: 401, data: { error: 'Invalid credentials' } };
  }

  const token = jwt.sign(
    { id: user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_DAYS + 'd' }
  );

  return {
    status: 200,
    data: { token, user: { id: user.rows[0].id, name: user.rows[0].name, role: user.rows[0].role } },
  };
};

exports.getProfile = async (req) => {
  const userId = req.user.id;
  const user = await db.query('SELECT id, name, email, statistics, role FROM users WHERE id = $1', [userId]);
  
  if (user.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json(user.rows[0]);
}

exports.listUsers = async () => {
  try {
    const result = await db.query('SELECT id, name, email, phonenum, statistics, role, enter_time, leave_time FROM users');
    return { status: 200, data: result.rows };
  } catch (err) {
    console.log(err);
    return { status: 500, data: { error: 'Internal server error' } };
  }
}