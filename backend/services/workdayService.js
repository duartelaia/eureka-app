const db = require("../db");

exports.updateWorkday = async ({ userId, date, entry_time, exit_time, absence, exc_absence, notes }) => {
  try {
    const entryTimeValue = entry_time === '' ? null : entry_time;
    const exitTimeValue = exit_time === '' ? null : exit_time;

    let query, params;
    if (exc_absence === null || typeof exc_absence === 'undefined') {
      // Do not update exc_absence
      query = `
        INSERT INTO workday (user_id, date, entry_time, exit_time, absence, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, date)
        DO UPDATE SET
          entry_time = EXCLUDED.entry_time,
          exit_time = EXCLUDED.exit_time,
          absence = EXCLUDED.absence,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING *`;
      params = [userId, date, entryTimeValue, exitTimeValue, absence, notes];
    } else {
      // Update exc_absence
      query = `
        INSERT INTO workday (user_id, date, entry_time, exit_time, absence, exc_absence, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, date)
        DO UPDATE SET
          entry_time = EXCLUDED.entry_time,
          exit_time = EXCLUDED.exit_time,
          absence = EXCLUDED.absence,
          exc_absence = EXCLUDED.exc_absence,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING *`;
      params = [userId, date, entryTimeValue, exitTimeValue, absence, exc_absence, notes];
    }

    const result = await db.query(query, params);
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
    const startDate = `${year1}-09-01`;
    const endDate = `${year2}-08-31`;

    const result = await db.query(
      `SELECT
        TO_CHAR(w.date, 'YYYY-MM') AS month,

        -- Format total worked hours as HH:MM
        LPAD(FLOOR(SUM(
          CASE
            WHEN w.absence AND NOT w.exc_absence THEN 0
            ELSE COALESCE(EXTRACT(EPOCH FROM (w.exit_time - w.entry_time)), 0)
                - COALESCE((
                    SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)))
                    FROM break b WHERE b.workday_id = w.id
                  ), 0)
          END
        ) / 3600)::TEXT, 2, '0') || ':' ||
        LPAD(FLOOR(
          MOD(
            SUM(
              CASE
                WHEN w.absence AND NOT w.exc_absence THEN 0
                ELSE COALESCE(EXTRACT(EPOCH FROM (w.exit_time - w.entry_time)), 0)
                    - COALESCE((
                        SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)))
                        FROM break b WHERE b.workday_id = w.id
                      ), 0)
              END
            ) / 60, 60
          )
        )::TEXT, 2, '0') AS total_worked_hours,

        -- Format total extra hours as HH:MM with correct sign
        (CASE
          WHEN SUM(
            CASE
              WHEN w.absence AND NOT w.exc_absence THEN -7 * 3600
              ELSE
                CASE
                  WHEN w.exc_absence THEN 0
                  ELSE (
                    COALESCE(EXTRACT(EPOCH FROM (w.exit_time - w.entry_time)), 0)
                    - COALESCE((
                        SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)))
                        FROM break b WHERE b.workday_id = w.id
                      ), 0)
                    - 7 * 3600
                  )
                END
            END
          ) < 0 THEN '-'
          ELSE ''
        END) ||
        LPAD(FLOOR(ABS(SUM(
          CASE
            WHEN w.absence AND NOT w.exc_absence THEN -7 * 3600
            ELSE
              CASE
                WHEN w.exc_absence THEN 0
                ELSE (
                  COALESCE(EXTRACT(EPOCH FROM (w.exit_time - w.entry_time)), 0)
                  - COALESCE((
                      SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)))
                      FROM break b WHERE b.workday_id = w.id
                    ), 0)
                  - 7 * 3600
                )
              END
          END
        ) / 3600))::TEXT, 2, '0') || ':' ||
        LPAD(FLOOR(
          MOD(
            ABS(SUM(
              CASE
                WHEN w.absence AND NOT w.exc_absence THEN -7 * 3600
                ELSE
                  CASE
                    WHEN w.exc_absence THEN 0
                    ELSE (
                      COALESCE(EXTRACT(EPOCH FROM (w.exit_time - w.entry_time)), 0)
                      - COALESCE((
                          SELECT SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)))
                          FROM break b WHERE b.workday_id = w.id
                        ), 0)
                      - 7 * 3600
                    )
                  END
              END
            ) / 60), 60
          )
        )::TEXT, 2, '0') AS total_extra_hours

      FROM workday w
      WHERE w.user_id = $1 AND w.date >= $2 AND w.date <= $3
      GROUP BY month
      ORDER BY month`,
      [userId, startDate, endDate]
    );

    return { status: 200, data: result.rows };
  } catch (error) {
    console.error('Error listing worked and extra hours:', error);
    return { status: 500, data: { error: 'Internal server error' } };
  }
};