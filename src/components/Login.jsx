import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      // Save token & user info in localStorage for later requests
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Pass the user object up to App.jsx
      onLogin(data.user);
    } catch (err) {
      console.error(err);
      setError("Server error, please try again.");
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#f0f2f5", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "40px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h2 style={{ 
          textAlign: "center", 
          color: "#333", 
          marginTop: 0,
          marginBottom: "30px",
          fontSize: "28px"
        }}>
          Guidance Board Login
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#555", 
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "12px", 
                borderRadius: "4px", 
                border: "1px solid #ddd",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#555", 
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "12px", 
                borderRadius: "4px", 
                border: "1px solid #ddd",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          {error && (
            <div style={{ 
              backgroundColor: "#f8d7da", 
              color: "#721c24", 
              padding: "12px", 
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "14px",
              border: "1px solid #f5c6cb"
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            style={{ 
              width: "100%", 
              padding: "12px", 
              backgroundColor: "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
          >
            Login
          </button>
        </form>

        <div style={{ 
          marginTop: "20px", 
          textAlign: "center", 
          color: "#999", 
          fontSize: "12px" 
        }}>
          Please contact your administrator if you need assistance
        </div>
      </div>
    </div>
  );
}