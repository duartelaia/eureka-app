export default function Navbar({ user, onLogout }) {
  return (
    <nav className="flex justify-between items-center bg-blue-600 text-white px-4 py-2 rounded mb-6">
      <span className="font-semibold text-lg">Eureka App</span>
      <div className="flex items-center gap-4">
        <span>Welcome, <strong>{user.name}</strong></span>
        <button
          onClick={onLogout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}