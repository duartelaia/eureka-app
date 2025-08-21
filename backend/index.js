// For testing
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const helpers = require('./helpers.js');
const db = require('./db');

dotenv.config();
const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(helmet());
app.use(cookieParser());

// TODO: Change to a reasonable limit for production
const AuthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// User Routes
app.use('/api/user', AuthLimiter);
app.use('/api/user', require('./routes/userRoutes'));

// Workday Routes
app.use('/api/workday', require('./routes/workdayRoutes'));

// Add admin user
async function ensureAdminUser() {
  const adminEmail = 'admin@eureka.local';
  const adminPassword = 'admin123'; // TODO: Change to a secure password in production
  const adminName = 'Admin';

  const result = await db.query(
    'SELECT * FROM users WHERE role = $1 LIMIT 1',
    ['admin']
  );
  if (result.rows.length === 0) {
    const hashed = await helpers.hashPassword(adminPassword);
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [adminName, adminEmail, hashed, 'admin']
    );
    console.log(`Default admin user created: ${adminEmail} / ${adminPassword}`);
  }
}

if (process.env.NODE_ENV !== 'test') {
  ensureAdminUser();
}

module.exports = app;

if (require.main === module) {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}