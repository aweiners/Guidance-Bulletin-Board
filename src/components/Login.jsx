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
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      console.error(err);
      setError("Server error, please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-center text-gray-800 mt-0 mb-8 text-2xl font-bold">
          Guidance Board Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 text-gray-600 text-sm font-medium">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded border border-gray-300 text-sm"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-gray-600 text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded border border-gray-300 text-sm"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded mb-5 text-sm border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 text-white rounded text-lg font-medium cursor-pointer hover:bg-blue-800 transition-colors"
          >
            Login
          </button>
        </form>

        <div className="mt-5 text-center text-gray-500 text-xs">
          Please contact your administrator if you need assistance
        </div>
      </div>
    </div>
  );
}
