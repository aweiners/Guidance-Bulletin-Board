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
    <div className="max-w-[900px] mx-auto p-5">
      <div className="bg-gray-100 rounded-lg p-5 mb-5">
        <h2 className="mt-0 text-gray-800 border-b-2 border-blue-600 pb-2">
          Announcements
        </h2>

        {role === "admin" && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 rounded-lg mb-5"
          >
            <div className="mb-2">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-2 rounded border border-gray-300"
                required
              />
            </div>
            <div className="mb-2">
              <textarea
                placeholder="Content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full p-2 rounded border border-gray-300 min-h-[80px]"
                required
              ></textarea>
            </div>
            <div className="mb-2">
              <input
                placeholder="Embed URL"
                value={form.embed_url}
                onChange={(e) => setForm({ ...form, embed_url: e.target.value })}
                className="w-full p-2 rounded border border-gray-300"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded cursor-pointer"
            >
              {editingId ? "Update" : "Add"} Announcement
            </button>
          </form>
        )}

        <div>
          {announcements.length > 0 ? (
            announcements.map(a => (
              <div
                key={a.id}
                className="bg-white p-4 rounded-lg mb-2 shadow-sm"
              >
                <h3 className="m-0 mb-2 text-blue-600">{a.title}</h3>
                <p className="m-0 mb-2 text-gray-700">{a.content}</p>

                {role === "admin" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="px-3 py-1 bg-green-600 text-white rounded cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-5 rounded-lg text-center text-gray-500">
              No announcements available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
