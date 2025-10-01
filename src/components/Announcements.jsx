import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Announcements({ role }) {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", embed_url: "" });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAnnouncements();
  }, [role]);

  const fetchAnnouncements = () => {
    fetch("http://localhost:5000/announcements")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load announcements"));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role !== "admin") return toast.error("Admin only");
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error("Title and content cannot be empty");
    }
    if (form.embed_url && !/^(https?:\/\/[^\s]+)$/i.test(form.embed_url)) {
      return toast.error("Invalid embed URL");
    }
    if (editingId && !window.confirm("Update this announcement?")) return;

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId
      ? `http://localhost:5000/announcements/${editingId}`
      : `http://localhost:5000/announcements`;

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(form)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        toast.success(editingId ? "Announcement updated" : "Announcement added");
        setForm({ title: "", content: "", embed_url: "" });
        setEditingId(null);
        fetchAnnouncements();
      })
      .catch(() => toast.error("Failed to save announcement"));
  };

  const handleEdit = (a) => {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, embed_url: a.embed_url || "" });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    fetch(`http://localhost:5000/announcements/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error();
        toast.success("Announcement deleted");
        fetchAnnouncements();
      })
      .catch(() => toast.error("Delete failed"));
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0, color: "#333", borderBottom: "2px solid #007bff", paddingBottom: "10px" }}>
          Announcements
        </h2>

        {role === "admin" && (
          <form onSubmit={handleSubmit} style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
            <div style={{ marginBottom: "10px" }}>
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                required
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <textarea
                placeholder="Content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "80px" }}
                required
              ></textarea>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <input
                placeholder="Embed URL"
                value={form.embed_url}
                onChange={(e) => setForm({ ...form, embed_url: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>
            <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              {editingId ? "Update" : "Add"} Announcement
            </button>
          </form>
        )}

        <div>
          {announcements.length > 0 ? (
            announcements.map(a => (
              <div key={a.id} style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#007bff" }}>{a.title}</h3>
                <p style={{ margin: "0 0 10px 0", color: "#555" }}>{a.content}</p>
                {role === "admin" && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(a)}
                      style={{ padding: "6px 12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "6px", textAlign: "center", color: "#999" }}>
              No announcements available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
