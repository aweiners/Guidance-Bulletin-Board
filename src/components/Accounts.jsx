import { useState, useEffect } from "react";

export default function Accounts({ role }) {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "user" });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (role === "admin") fetchAccounts();
  }, [role]);

  const fetchAccounts = () => {
    fetch("http://localhost:5000/accounts", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setAccounts(data);
        else setAccounts([]);
      })
      .catch(err => console.error("Fetch accounts error:", err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId
      ? `http://localhost:5000/accounts/${editingId}`
      : `http://localhost:5000/accounts`;

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(form)
    })
      .then(() => {
        setForm({ username: "", password: "", role: "user" });
        setEditingId(null);
        fetchAccounts();
      });
  };

  const handleEdit = (acc) => {
    setEditingId(acc.id);
    setForm({ username: acc.username, password: acc.password || "", role: acc.role });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this account?")) return;
    fetch(`http://localhost:5000/accounts/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(() => fetchAccounts())
      .catch(console.error);
  };

  if (role !== "admin") {
    return (
      <div className="max-w-[900px] mx-auto p-5">
        <div className="bg-yellow-100 border border-yellow-500 rounded-lg p-5 text-center">
          <h2 className="text-yellow-800 mt-0">Accounts (Admin Only)</h2>
          <p className="text-yellow-800">You do not have permission to view accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="bg-gray-100 rounded-lg p-5 mb-5">
        <h2 className={`mt-0 text-gray-800 border-b-2 border-green-600 pb-2`}>
          {editingId ? "Edit Account" : "Manage Accounts"}
        </h2>

        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg mb-5">
          <div className="mb-2">
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 box-border"
              required
            />
          </div>

          <div className="mb-2">
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 box-border"
              required={!editingId}
            />
          </div>

          <div className="mb-2">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 box-border"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-green-600 text-white rounded cursor-pointer"
          >
            {editingId ? "Update Account" : "Create Account"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ username: "", password: "", role: "user" });
              }}
              className="px-5 py-2 bg-gray-600 text-white rounded cursor-pointer ml-2"
            >
              Cancel
            </button>
          )}
        </form>

        <div>
          <h3 className="text-gray-800 mb-4">All Accounts</h3>
          {Array.isArray(accounts) && accounts.length > 0 ? (
            accounts.map(acc => (
              <div
                key={acc.id}
                className="bg-white p-4 rounded-lg mb-2 shadow-sm flex justify-between items-center"
              >
                <div>
                  <strong className="text-gray-800 text-lg">{acc.username}</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${acc.role === "admin"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                    }`}>
                    {acc.role}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(acc)}
                    className="px-3 py-1 bg-blue-600 text-white rounded cursor-pointer text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded cursor-pointer text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-5 rounded-lg text-center text-gray-500">
              No accounts available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
