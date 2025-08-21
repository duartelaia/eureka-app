\connect mydb_test

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phonenum INTEGER,
  password TEXT NOT NULL, 
  role TEXT DEFAULT 'member',
  statistics BOOLEAN DEFAULT FALSE,
  enter_time TIME,
  leave_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workday(
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_time TIME,
  exit_time TIME,
  notes TEXT,
  absence BOOLEAN DEFAULT FALSE,
  exc_absence BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE TABLE break(
  id SERIAL PRIMARY KEY,
  workday_id INTEGER REFERENCES workday(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);