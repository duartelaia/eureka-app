import { useState } from "react";
import CalendarPage from "./calendar";
import UserListPage from "./userlist";

export default function Body({ user }) {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleViewCalendar = (user) => {
    setSelectedUser(user);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  if (user.role === "admin") {
    return (
      <div>
        {selectedUser ? (
          <div>
            <button
              className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={handleBack}
            >
              &larr; Back to User List
            </button>
            <div className="mb-2 text-lg font-semibold">
              Viewing calendar for: {selectedUser.name}
            </div>
            <CalendarPage userId={String(selectedUser.id)} />
          </div>
        ) : (
          <UserListPage onViewCalendar={handleViewCalendar} />
        )}
      </div>
    );
  }

  return (
    <div>
      <CalendarPage />
    </div>
  );
}