import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Resources({ role }) {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", file_url: "" });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchResources();
  }, [role]);

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
    <div className="max-w-[900px] mx-auto p-5">
      <div className="bg-gray-100 rounded-lg p-5 mb-5">
        <h2 className="mt-0 text-gray-800 border-b-2 border-teal-500 pb-2">Resources</h2>

        {role === "admin" && (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg mb-5">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2 mb-2 rounded border border-gray-300"
              required
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2 mb-2 rounded border border-gray-300"
              required
            ></textarea>
            <input
              placeholder="File URL"
              value={form.file_url}
              onChange={(e) => setForm({ ...form, file_url: e.target.value })}
              className="w-full p-2 mb-2 rounded border border-gray-300"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 text-white rounded"
            >
              {editingId ? "Update" : "Add"} Resource
            </button>
          </form>
        )}

        {resources.length > 0 ? (
          resources.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-lg mb-2 shadow-sm">
              <h3 className="m-0 mb-2 text-teal-600">{r.title}</h3>
              <p className="m-0 mb-2">{r.description}</p>
              {r.file_url && (
                <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  View File →
                </a>
              )}

              {role === "admin" && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(r)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
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
