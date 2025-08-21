const db = require("../db");

exports.updateWorkday = async ({ userId, date, entry_time, exit_time, notes }) => {
  try {
    const result = await db.query(
      `INSERT INTO workday (user_id, date, entry_time, exit_time, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date)
       DO UPDATE SET
         entry_time = EXCLUDED.entry_time,
         exit_time = EXCLUDED.exit_time,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [userId, date, entry_time, exit_time, notes]
    );
    if (result.rows.length === 0) {
      return { status: 500, data: { error: 'Internal server error' } };
    }
    return { status: 200, data: result.rows[0] };
  } catch (error) {
    console.error('Error updating workday:', error);
    return { status: 500, data: { error: 'Internal server error' } };
  }
};

exports.deleteWorkday = async ({ userId, date }) => {
  try {
    const result = await db.query(
      'DELETE FROM workday WHERE user_id = $1 AND date = $2 RETURNING *',
      [userId, date]
    );

    if (result.rows.length === 0) {
      return { status: 404, data: { error: 'Workday not found' } };
    }

    return { status: 200, data: { message: 'Workday deleted successfully' } };
  } catch (error) {
    return { status: 500, data: { error: 'Internal server error' } };
  }
}

exports.listUserMonthWorkdays = async ({ userId, month }) => {
  try {
    // Compute first and next month dates
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const nextMonth = new Date(year, monthNum, 1);
    const firstDayStr = firstDay.toISOString().slice(0, 10);
    const nextMonthStr = nextMonth.toISOString().slice(0, 10);

    const workdaysJoinedRows = await db.query(
      `SELECT w.*, b.id AS break_id, b.start_time, b.end_time
      FROM workday w
      LEFT JOIN break b ON w.id = b.workday_id
      WHERE w.user_id = $1 AND w.date >= $2 AND w.date < $3
      ORDER BY w.id, b.start_time`,
      [userId, firstDayStr, nextMonthStr]
    );

    const workdays = new Map();

    for (const row of workdaysJoinedRows.rows) {
      if (!workdays.has(row.id)) {
        workdays.set(row.id, { ...row, breaks: [] });
      }
      if (row.break_id) {
        workdays.get(row.id).breaks.push({
          id: row.break_id,
          start_time: row.start_time,
          end_time: row.end_time
        });
      }
    }

    return { status: 200, data: Array.from(workdays.values()) };
  } catch (error) {
    return { status: 500, data: { error: 'Internal server error' } };
  }
}

exports.insertBreak = async ({ workdayId, start_time, end_time }) => {
  try {
    const result = await db.query(
      'INSERT INTO break (workday_id, start_time, end_time) VALUES ($1, $2, $3) RETURNING *',
      [workdayId, start_time, end_time]
    );
    return { status: 200, data: result.rows[0] };
  } catch (error) {
    console.log(error);
    return { status: 500, data: { error: 'Internal server error' } };
  }
};

exports.updateBreak = async ({ id, start_time, end_time }) => {
  try {
    const result = await db.query(
      'UPDATE break SET start_time = $1, end_time = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [start_time, end_time, id]
    );
    if (result.rows.length === 0) {
      return { status: 404, data: { error: 'Break not found' } };
    }
    return { status: 200, data: result.rows[0] };

  } catch (error) {
    return { status: 500, data: { error: 'Internal server error' } };
  }
}

exports.deleteBreak = async ({ id }) => {
  try {
    const result = await db.query(
      'DELETE FROM break WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return { status: 404, data: { error: 'Break not found' } };
    }
    return { status: 200, data: { message: 'Break deleted successfully' } };

  } catch (error) {
    return { status: 500, data: { error: 'Internal server error' } };
  }
}

exports.listBreaks = async ({ workdayId }) => {
  try {
    const result = await db.query(
      'SELECT id, start_time, end_time FROM break WHERE workday_id = $1 ORDER BY start_time',
      [workdayId]
    );
    return { status: 200, data: {breaks: result.rows} };
  } catch (error) {
    console.error('Error listing breaks:', error);
    return { status: 500, data: { error: 'Internal server error' } };
  }
}

exports.listWorkedHours = async ({ userId, schoolYear }) => {
  try {
    const [year1, year2] = schoolYear.split('-').map(Number);

    const result = await db.query(
      `SELECT
          TO_CHAR(w.date, 'YYYY-MM') AS month,
          LPAD(FLOOR(
            SUM(
              (
                EXTRACT(EPOCH FROM (w.exit_time - w.entry_time)) -
                COALESCE(
                  (
                    SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)))
                    FROM break b
                    WHERE b.workday_id = w.id
                  ), 0
                )
              ) / 3600
            )
          )::TEXT, 2, '0') || ':' ||
          LPAD(FLOOR(
            MOD(
              SUM(
                (
                  EXTRACT(EPOCH FROM (w.exit_time - w.entry_time)) -
                  COALESCE(
                    (
                      SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)))
                      FROM break b
                      WHERE b.workday_id = w.id
                    ), 0
                  )
                ) / 60
              ), 60
            )
          )::TEXT, 2, '0') AS total_hours
        FROM workday w
        WHERE w.user_id = $1 AND w.date >= $2 AND w.date <= $3
        GROUP BY month
        ORDER BY month`,
      [userId, `${year1}-09-01`, `${year2}-08-31`]
    );
    return { status: 200, data: result.rows };
  } catch (error) {
    console.error('Error listing worked hours:', error);
    return { status: 500, data: { error: 'Internal server error' } };
  }
};
