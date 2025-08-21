import { useEffect, useState } from 'react';
import axios from 'axios';

export default function UserListPage({ onViewCalendar }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phonenum: '',
    password: '',
    statistics: false,
    enter_time: '',
    leave_time: '',
    role: 'member'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/listUsers`, { withCredentials: true });
      setUsers(res.data.users || []);
    } catch (err) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setModalUser(user);
    console.log(user);
    setForm({
      name: user.name,
      email: user.email,
      phonenum: user.phonenum,
      password: '',
      statistics: user.statistics,
      enter_time: user.enter_time || '',
      leave_time: user.leave_time || '',
      role: user.role
    });
    setAddMode(false);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setModalUser(null);
    setForm({
      name: '',
      email: '',
      phonenum: '',
      password: '',
      statistics: false,
      enter_time: '',
      leave_time: '',
      role: 'member'
    });
    setAddMode(true);
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (addMode) {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/updateUser`, form, { withCredentials: true });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/updateUser`, { ...form, phonenum: String(form.phonenum), id: String(modalUser.id) }, { withCredentials: true });
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      // Optionally show error
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewStatistics = (user) => {
    window.location.href = `/statistics?userId=${user.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">User List</h1>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={openAddModal}
          >
            Add User
          </button>
        </div>
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                      onClick={() => onViewCalendar(user)}
                    >
                      Calendar
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      onClick={() => handleViewStatistics(user)}
                    >
                      Statistics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">{addMode ? 'Add User' : 'Edit User'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone Number</label>
                <input
                  type="number"
                  name="phonenum"
                  value={form.phonenum}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  placeholder={addMode ? "" : "Leave blank to keep current password"}
                  required={addMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Statistics</label>
                <input
                  type="checkbox"
                  name="statistics"
                  checked={form.statistics}
                  onChange={handleFormChange}
                  className="ml-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Enter Time</label>
                <input
                  type="time"
                  name="enter_time"
                  value={form.enter_time}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Leave Time</label>
                <input
                  type="time"
                  name="leave_time"
                  value={form.leave_time}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={formLoading}
              >
                {formLoading ? 'Saving...' : (addMode ? 'Add User' : 'Update User')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}