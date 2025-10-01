import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Resources({ role }) {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", file_url: "" });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchResources(); }, [role]);

  const fetchResources = () => {
    fetch("http://localhost:5000/resources")
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load resources"));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role !== "admin") return toast.error("Admin only");
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error("Title and description cannot be empty");
    }
    if (form.file_url && !/^(https?:\/\/[^\s]+)$/i.test(form.file_url)) {
      return toast.error("Invalid file URL");
    }
    if (editingId && !window.confirm("Update this resource?")) return;

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId
      ? `http://localhost:5000/resources/${editingId}`
      : `http://localhost:5000/resources`;

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(form)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        toast.success(editingId ? "Resource updated" : "Resource added");
        setForm({ title: "", description: "", file_url: "" });
        setEditingId(null);
        fetchResources();
      })
      .catch(() => toast.error("Failed to save resource"));
  };

  const handleEdit = (r) => {
    setEditingId(r.id);
    setForm({ title: r.title, description: r.description, file_url: r.file_url || "" });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this resource?")) return;
    fetch(`http://localhost:5000/resources/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error();
        toast.success("Resource deleted");
        fetchResources();
      })
      .catch(() => toast.error("Delete failed"));
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0, color: "#333", borderBottom: "2px solid #17a2b8", paddingBottom: "10px" }}>Resources</h2>

        {role === "admin" && (
          <form onSubmit={handleSubmit} style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
              required
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
              required
            ></textarea>
            <input
              placeholder="File URL"
              value={form.file_url}
              onChange={(e) => setForm({ ...form, file_url: e.target.value })}
              style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
            <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px" }}>
              {editingId ? "Update" : "Add"} Resource
            </button>
          </form>
        )}

        {resources.length > 0 ? (
          resources.map(r => (
            <div key={r.id} style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#17a2b8" }}>{r.title}</h3>
              <p style={{ margin: "0 0 10px 0" }}>{r.description}</p>
              {r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer">View File →</a>}
              {role === "admin" && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button onClick={() => handleEdit(r)} style={{ backgroundColor: "#28a745", color: "white", padding: "6px 12px" }}>Edit</button>
                  <button onClick={() => handleDelete(r.id)} style={{ backgroundColor: "#dc3545", color: "white", padding: "6px 12px" }}>Delete</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div>No resources available</div>
        )}
      </div>
    </div>
  );
}
