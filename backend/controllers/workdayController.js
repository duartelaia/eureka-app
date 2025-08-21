const workdayService = require('../services/workdayService');

exports.updateWorkday = async (req, res) => {
  try {
    const { date, entry_time, exit_time, notes } = req.body;
    let userId;

    if (req.user.role === 'admin') {
      userId = req.body.userId; // Admin can specify target user
      // Validate userId is present and valid
      if (!userId || typeof userId !== 'string' || !/^\d+$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
    } else {
      userId = req.user.id; // Non-admin can only modify their own data
    }

    // Validate date (YYYY-MM-DD)
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    // Validate entry_time and exit_time (HH:MM or HH:MM:SS)
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!entry_time || typeof entry_time !== 'string' || !timeRegex.test(entry_time)) {
      return res.status(400).json({ error: 'Entry time must be in HH:MM or HH:MM:SS format' });
    }
    if (!exit_time || typeof exit_time !== 'string' || !timeRegex.test(exit_time)) {
      return res.status(400).json({ error: 'Leave time must be in HH:MM or HH:MM:SS format' });
    }
    // Validate notes (optional, but if present must be a string)
    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string' });
    }
    // Prevent exit_time before entry_time
    if (entry_time && exit_time && entry_time > exit_time) {
      return res.status(400).json({ error: 'Exit time cannot be before entry time' });
    }

    const result = await workdayService.updateWorkday({ userId, date, entry_time, exit_time, notes });
    res.status(result.status).json(result.data);
   
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.deleteWorkday = async (req, res) => {
  try {
    const { date } = req.body;
    let userId;
    
    if (req.user.role === 'admin') {
      userId = req.body.userId; // Admin can specify target user
      // Validate userId is present and valid
      if (!userId || typeof userId !== 'string' || !/^\d+$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
    } else {
      userId = req.user.id; // Non-admin can only modify their own data
    }

    // Validate date (YYYY-MM-DD)
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    const result = await workdayService.deleteWorkday({ userId, date });
    res.status(result.status).json(result.data);
   
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.listMonthWorkdays = async (req, res) => {
  try {
    const { month } = req.query;
    let userId;

    if (req.user.role === 'admin') {
      userId = req.query.userId; // Admin can specify target user
      // Validate userId is present and valid
      if (!userId || typeof userId !== 'string' || !/^\d+$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
    } else {
      userId = req.user.id; // Non-admin can only modify their own data
    }

    // Validate month (YYYY-MM)
    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
    }

    const result = await workdayService.listUserMonthWorkdays({ userId, month });
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.insertBreak = async (req, res) => {
  try {
    const { workdayId, start_time, end_time } = req.body;

    // Validate workdayId is a number 
    if (!workdayId || typeof workdayId !== 'string' || !/^\d+$/.test(workdayId) || Number(workdayId) <= 0) {
      return res.status(400).json({ error: 'Invalid workday ID format' });
    }

    // Validate start_time and end_time (HH:MM or HH:MM:SS)
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!start_time || typeof start_time !== 'string' || !timeRegex.test(start_time)) {
      return res.status(400).json({ error: 'Start time must be in HH:MM or HH:MM:SS format' });
    }
    if (!end_time || typeof end_time !== 'string' || !timeRegex.test(end_time)) {
      return res.status(400).json({ error: 'End time must be in HH:MM or HH:MM:SS format' });
    }

    // Prevent break end_time before start_time
    if (start_time && end_time && start_time > end_time) {
      return res.status(400).json({ error: 'Break end time cannot be before start time' });
    }
    const result = await workdayService.insertBreak({ workdayId, start_time, end_time });
    res.status(result.status).json(result.data);
   
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.updateBreak = async (req, res) => {
  try {
    const { id, start_time, end_time } = req.body;

    // Validate ID
    if (!id || typeof id !== 'string' || !/^\d+$/.test(id) || Number(id) <= 0) {
      return res.status(400).json({ error: 'Invalid break ID format' });
    }

    // Validate start_time and end_time (HH:MM or HH:MM:SS)
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!start_time || typeof start_time !== 'string' || !timeRegex.test(start_time)) {
      return res.status(400).json({ error: 'Start time must be in HH:MM or HH:MM:SS format' });
    }
    if (!end_time || typeof end_time !== 'string' || !timeRegex.test(end_time)) {
      return res.status(400).json({ error: 'End time must be in HH:MM or HH:MM:SS format' });
    }

    // Prevent break end_time before start_time
    if (start_time && end_time && start_time > end_time) {
      return res.status(400).json({ error: 'Break end time cannot be before start time' });
    }
    const result = await workdayService.updateBreak({ id, start_time, end_time });
    res.status(result.status).json(result.data);

  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.deleteBreak = async (req, res) => {
  try {
    const { id } = req.body;

    // Validate ID
    if (!id || typeof id !== 'string' || !/^\d+$/.test(id) || Number(id) <= 0) {
      return res.status(400).json({ error: 'Invalid break ID format' });
    }

    const result = await workdayService.deleteBreak({ id });
    res.status(result.status).json(result.data);
   
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.listBreaks = async (req, res) => {
  try {
    const { workdayId } = req.query;

    // Validate workdayId is a number (integer string)
    if (!workdayId || typeof workdayId !== 'string' || !/^\d+$/.test(workdayId) || Number(workdayId) <= 0) {
      return res.status(400).json({ error: 'Invalid workday ID format' });
    }

    const result = await workdayService.listBreaks({ workdayId });
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

exports.listWorkedHours = async (req, res) => {
  try {
    const { schoolYear } = req.query;
    let userId;

    if (req.user.role === 'admin') {
      userId = req.query.userId; // Admin can specify target user
      // Validate userId is present and valid
      if (!userId || typeof userId !== 'string' || !/^\d+$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
    } else {
      userId = req.user.id; // Non-admin can only check their own data
    }

    // Validate schoolYear is present and valid (YYYY-YYYY)
    if (!schoolYear || typeof schoolYear !== 'string' || !/^\d{4}-\d{4}$/.test(schoolYear)) {
      return res.status(400).json({ error: 'Invalid school year format' });
    }

    const result = await workdayService.listWorkedHours({ userId, schoolYear });
    res.status(result.status).json(result.data);

  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}