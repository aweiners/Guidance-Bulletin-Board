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
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: "#fff",
        padding: "15px 30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#333" }}>Guidance Board</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => setCurrentPage("home")}
              style={{
                padding: "8px 16px", 
                backgroundColor: currentPage === "home" ? "#007bff" : "transparent",
                color: currentPage === "home" ? "white" : "#007bff",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage("forum")}
              style={{
                padding: "8px 16px", 
                backgroundColor: currentPage === "forum" ? "#6c757d" : "transparent",
                color: currentPage === "forum" ? "white" : "#6c757d",
                border: "1px solid #6c757d",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Forum
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ color: "#666" }}>
            <strong>{user.username}</strong> ({user.role})
          </span>
          <button 
            onClick={handleLogout}
            style={{
              padding: "8px 16px", 
              backgroundColor: "#dc3545", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <div style={{ padding: "0 20px" }}>
        {currentPage === "home" && (
          <>
            
            <Announcements role={user.role} />
            <Resources role={user.role} />
          </>
        )}
        {currentPage === "forum" && (
          <ForumPosts role={user.role} />
        )}
        {user.role === "admin" && <Accounts role={user.role} />}
      </div>
    </div>
  );
}
