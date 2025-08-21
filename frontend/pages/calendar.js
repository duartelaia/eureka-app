import { useEffect, useState } from 'react';
import axios from 'axios';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function Calendar({ year, month, monthData, onDayClick }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const rows = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
  function getWorkdayData(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthData.find(wd => wd.date && wd.date.startsWith(dateStr));
  }
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-gray-600 mb-2">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div className="grid grid-rows-6 grid-cols-7 gap-1">
        {Array.from({ length: 6 * 7 }).map((_, idx) => {
          const row = Math.floor(idx / 7);
          const col = idx % 7;
          const day = rows[row] && rows[row][col];
          const workday = day ? getWorkdayData(day) : null;
          return (
            <div key={idx} className="h-16 flex flex-col items-center justify-center rounded">
              {day && (
                <button
                  className={`w-8 h-8 flex items-center justify-center font-semibold rounded-full ${workday ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  onClick={() => onDayClick(day, workday)}
                >
                  {day}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarPage({userId}) {
  const [monthData, setMonthData] = useState([]);
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState(null);
  const [modalWorkday, setModalWorkday] = useState(null);
  const [form, setForm] = useState({ entry_time: '', exit_time: '', notes: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [breaks, setBreaks] = useState([]);
  const [breakForm, setBreakForm] = useState({ start_time: '', end_time: '' });
  const [editingBreakId, setEditingBreakId] = useState(null);

  useEffect(() => {
    fetchMonthData(`${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}`);
  }, [calendarDate]);

  useEffect(() => {
    setBreaks(modalWorkday?.breaks || []);
    setBreakForm({ start_time: '', end_time: '' });
    setEditingBreakId(null);
  }, [modalWorkday]);

  const fetchMonthData = async (month) => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workday/listMonth?month=${month}&userId=${userId}`, {
        withCredentials: true,
      });
      setMonthData(res.data);
    } catch (err) {
      setMonthData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBreaksFromWorkday = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workday/listBreaks?workdayId=${modalWorkday.id}`, {
        withCredentials: true,
      });
      setBreaks(res.data.breaks);
    } catch (err) {
      setBreaks([]);
    }
  };

  const handleDayClick = (day, workday) => {
    setModalDay(day);
    setModalWorkday(workday);
    setForm({
      entry_time: workday?.entry_time || '',
      exit_time: workday?.exit_time || '',
      notes: workday?.notes || '',
    });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalDay(null);
    setModalWorkday(null);
    setForm({ entry_time: '', exit_time: '', notes: '' });
  };

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const dateStr = `${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}-${String(modalDay).padStart(2, '0')}`;
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workday/updateWorkday`,
        {
          userId: userId,
          date: dateStr,
          entry_time: form.entry_time,
          exit_time: form.exit_time,
          notes: form.notes,
        },
        { withCredentials: true }
      );
      await fetchMonthData(`${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}`);
      setModalWorkday(res.data);
    } catch (err) {
      // Optionally show error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteWorkday = async () => {
    if (!modalWorkday) return;
    setFormLoading(true);
    const dateStr = `${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}-${String(modalDay).padStart(2, '0')}`;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workday/deleteWorkday`,
        { userId: userId, date: dateStr },
        { withCredentials: true }
      );
      await fetchMonthData(`${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, '0')}`);
      handleModalClose();
    } catch (err) {
      // Optionally show error
    } finally {
      setFormLoading(false);
    }
  };

  const handleBreakFormChange = (e) => {
    setBreakForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleBreakSubmit = async (e) => {
    e.preventDefault();
    if (!modalWorkday) return;
    try {
      if (editingBreakId) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workday/updateBreak`,
          {
            id: String(editingBreakId),
            start_time: String(breakForm.start_time),
            end_time: String(breakForm.end_time),
          },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workday/insertBreak`,
          {
            workdayId: String(modalWorkday.id),
            start_time: String(breakForm.start_time),
            end_time: String(breakForm.end_time),
          },
          { withCredentials: true }
        );
      }
      fetchBreaksFromWorkday();
      setBreakForm({ start_time: '', end_time: '' });
      setEditingBreakId(null);
    } catch (err) {
      // Optionally show error
    }
  };

  const handleEditBreak = (brk) => {
    setBreakForm({ start_time: brk.start_time, end_time: brk.end_time });
    setEditingBreakId(brk.id);
  };

  const handleDeleteBreak = async (breakId) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workday/deleteBreak`,
        { id: String(breakId) },
        { withCredentials: true }
      );
      fetchBreaksFromWorkday();
    } catch (err) {
      // Optionally show error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded p-6 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center justify-between mt-6 mb-2">
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setCalendarDate(d => {
              let m = d.month - 1;
              let y = d.year;
              if (m < 0) { m = 11; y--; }
              return { year: y, month: m };
            })}
          >
            &lt;
          </button>
          <span className="font-semibold">{new Date(calendarDate.year, calendarDate.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => setCalendarDate(d => {
              let m = d.month + 1;
              let y = d.year;
              if (m > 11) { m = 0; y++; }
              return { year: y, month: m };
            })}
          >
            &gt;
          </button>
        </div>
        <Calendar
          year={calendarDate.year}
          month={calendarDate.month}
          monthData={monthData}
          onDayClick={handleDayClick}
        />
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                onClick={handleModalClose}
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold mb-2">{modalWorkday ? 'Edit' : 'Add'} Workday for {calendarDate.year}-{String(calendarDate.month + 1).padStart(2, '0')}-{String(modalDay).padStart(2, '0')}</h2>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">Entry Time</label>
                  <input
                    type="time"
                    name="entry_time"
                    value={form.entry_time}
                    onChange={handleFormChange}
                    className="w-full border rounded px-2 py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Exit Time</label>
                  <input
                    type="time"
                    name="exit_time"
                    value={form.exit_time}
                    onChange={handleFormChange}
                    className="w-full border rounded px-2 py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    className="w-full border rounded px-2 py-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Saving...' : (modalWorkday ? 'Update' : 'Add')}
                  </button>
                  {modalWorkday && (
                    <button
                      type="button"
                      className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
                      onClick={handleDeleteWorkday}
                      disabled={formLoading}
                    >
                      {formLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </form>
              {modalWorkday && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold mb-2">Breaks</h3>
                  {breaks.length === 0 && <div className="text-gray-500 mb-2">No breaks</div>}
                  <ul className="mb-2">
                    {breaks.map(brk => (
                      <li key={brk.id} className="flex items-center justify-between mb-1">
                        <span>
                          {brk.start_time} - {brk.end_time}
                        </span>
                        <div className="flex gap-2">
                          <button
                            className="text-blue-500 hover:underline"
                            type="button"
                            onClick={() => handleEditBreak(brk)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-500 hover:underline"
                            type="button"
                            onClick={() => handleDeleteBreak(brk.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={handleBreakSubmit} className="flex gap-2 items-center">
                    <input
                      type="time"
                      name="start_time"
                      value={breakForm.start_time}
                      onChange={handleBreakFormChange}
                      className="border rounded px-2 py-1"
                      required
                    />
                    <span>-</span>
                    <input
                      type="time"
                      name="end_time"
                      value={breakForm.end_time}
                      onChange={handleBreakFormChange}
                      className="border rounded px-2 py-1"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      {editingBreakId ? 'Update' : 'Add'}
                    </button>
                    {editingBreakId && (
                      <button
                        type="button"
                        className="bg-gray-300 px-2 py-1 rounded ml-2"
                        onClick={() => {
                          setBreakForm({ start_time: '', end_time: '' });
                          setEditingBreakId(null);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
        {loading && <div className="text-center mt-4">Loading...</div>}
      </div>
    </div>
  );
}