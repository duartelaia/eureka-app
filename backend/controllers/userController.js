const userService = require('../services/userService');

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out' });
};

exports.updateUser = async (req, res) => {
  const { id, name, email, phonenum, password, statistics, enter_time, leave_time } = req.body;
  if (id && typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid user ID is required' });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!phonenum || typeof phonenum !== 'string' || !/^\d+$/.test(phonenum)) {
    return res.status(400).json({ error: 'Valid phone number is required' });
  }
  if (password && (typeof password !== 'string' || password.trim().length < 6)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  if (statistics === null || typeof statistics !== 'boolean') {
    return res.status(400).json({ error: 'Valid statistics required' });
  }
  const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!enter_time || typeof enter_time !== 'string' || !timeRegex.test(enter_time)) {
    return res.status(400).json({ error: 'Valid enter time is required' });
  }
  if (!leave_time || typeof leave_time !== 'string' || !timeRegex.test(leave_time)) {
    return res.status(400).json({ error: 'Valid leave time is required' });
  }
  // Normalize email to lowercase
  const result = await userService.updateUser({ ...req.body, email: email.toLowerCase() });
  res.status(result.status).json(result.data);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string' || !password.length) {
    return res.status(400).json({ error: 'Password is required' });
  }
  // Normalize email to lowercase
  const result = await userService.login({ ...req.body, email: email.toLowerCase() });
  if (result.status === 200) {
    res
      .cookie('token', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: process.env.JWT_EXPIRES_DAYS * 24 * 60 * 60 * 1000, // Convert days to milliseconds
      })
      .json({ user: result.data.user });
  } else {
    res.status(result.status).json(result.data);
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.listUsers = async (req, res) => {
  try {
    const result = await userService.listUsers();
    res.status(result.status).json({ users: result.data });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}