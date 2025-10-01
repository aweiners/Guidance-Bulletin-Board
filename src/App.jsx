import { useState, useEffect } from "react";
import Login from "./components/Login";
import Accounts from "./components/Accounts";
import Announcements from "./components/Announcements";
import Resources from "./components/Resources";
import ForumPosts from "./components/ForumPosts";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from "jwt-decode";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          toast.warning("Session expired. Logging out...");
          handleLogout();
        }
      } catch {
        handleLogout();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("home");
  };

  if (!user) {
    return <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Navigation Bar */}
      <nav className="bg-white px-6 py-4 shadow-sm mb-5 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <h1 className="m-0 text-2xl text-gray-800 font-bold">Guidance Board</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage("home")}
              className={`px-4 py-2 rounded border ${currentPage === "home"
                ? "bg-blue-600 text-white border-blue-600"
                : "text-blue-600 border-blue-600 bg-transparent"
                }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage("forum")}
              className={`px-4 py-2 rounded border ${currentPage === "forum"
                ? "bg-gray-600 text-white border-gray-600"
                : "text-gray-600 border-gray-600 bg-transparent"
                }`}
            >
              Forum
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            <strong>{user.username}</strong> ({user.role})
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div className="px-5">
        {currentPage === "home" && (
          <>
            <Announcements role={user.role} />
            <Resources role={user.role} />
          </>
        )}

        {currentPage === "forum" && <ForumPosts role={user.role} />}
        {user.role === "admin" && <Accounts role={user.role} />}
      </div>
    </div>
  );
}
