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
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
          <h2 style={{ color: "#856404", marginTop: 0 }}>Accounts (Admin Only)</h2>
          <p style={{ color: "#856404" }}>You do not have permission to view accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0, color: "#333", borderBottom: "2px solid #28a745", paddingBottom: "10px" }}>
          {editingId ? "Edit Account" : "Manage Accounts"}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "10px" }}>
            <input 
              placeholder="Username" 
              value={form.username} 
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box" }}
              required
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <input 
              type="password" 
              placeholder="Password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box" }}
              required={!editingId}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <select 
              value={form.role} 
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box" }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button 
            type="submit"
            style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
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
              style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginLeft: "10px" }}
            >
              Cancel
            </button>
          )}
        </form>

        <div>
          <h3 style={{ color: "#333", marginBottom: "15px" }}>All Accounts</h3>
          {Array.isArray(accounts) && accounts.length > 0 ? (
            accounts.map(acc => (
              <div key={acc.id} style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: "#333", fontSize: "16px" }}>{acc.username}</strong>
                  <span style={{ 
                    marginLeft: "10px",
                    padding: "4px 8px", 
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: acc.role === "admin" ? "#d4edda" : "#e7f3ff",
                    color: acc.role === "admin" ? "#155724" : "#004085"
                  }}>
                    {acc.role}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => handleEdit(acc)}
                    style={{ padding: "6px 12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(acc.id)}
                    style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "6px", textAlign: "center", color: "#999" }}>
              No accounts available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}