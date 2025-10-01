import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function ForumPosts({ role }) {
  const [forumPosts, setForumPosts] = useState([]);
  const [form, setForm] = useState({ title: "", post_content: "", status: "pending" });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setForumPosts([]);
      return;
    }
    fetchForumPosts();
  }, [role, token]);

  const fetchForumPosts = () => {
    fetch("http://localhost:5000/forum_posts", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setForumPosts(data);
        else setForumPosts([]);
      })
      .catch(err => {
        console.error("Forum fetch error:", err);
        toast.error("Failed to load forum posts");
        setForumPosts([]);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.post_content.trim()) {
      toast.error("Title and post content required");
      return;
    }
    if (editingId && !window.confirm("Update this post?")) return;

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId
      ? `http://localhost:5000/forum_posts/${editingId}`
      : `http://localhost:5000/forum_posts`;

    const payload = editingId
      ? { ...form }
      : { title: form.title, post_content: form.post_content };

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success(editingId ? "Post updated" : role === "admin" ? "Message posted" : "Message pending approval");
        setForm({ title: "", post_content: "", status: "pending" });
        setEditingId(null);
        fetchForumPosts();
      })
      .catch(err => {
        console.error("Forum post save error:", err);
        toast.error("Failed to save post");
      });
  };

  const handleEdit = (post) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      post_content: post.post_content,
      status: post.status,
      user_id: post.user_id
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (role !== "admin") {
      toast.error("Admin only");
      return;
    }
    if (!window.confirm("Delete this post?")) return;
    fetch(`http://localhost:5000/forum_posts/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success("Post deleted");
        fetchForumPosts();
      })
      .catch(err => {
        console.error("Forum delete error:", err);
        toast.error("Delete failed");
      });
  };

  const handleStatusChange = (id, newStatus) => {
    if (role !== "admin") {
      toast.error("Admin only");
      return;
    }
    const post = forumPosts.find(p => p.id === id);
    fetch(`http://localhost:5000/forum_posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ ...post, status: newStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success(`Post ${newStatus}`);
        fetchForumPosts();
      })
      .catch(err => {
        console.error("Forum status change error:", err);
        toast.error("Status change failed");
      });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", post_content: "", status: "pending" });
  };

  if (!token) {
    return (
      <div className="max-w-[900px] mx-auto p-5">
        <div className="bg-yellow-100 border border-yellow-500 rounded-lg p-10 text-center">
          <h2 className="text-yellow-800 mt-0 text-2xl">🔒 Forum Access Restricted</h2>
          <p className="text-yellow-800 text-lg">You must log in to view and post in the forum.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="bg-gray-100 rounded-lg p-5">
        <form
          onSubmit={handleSubmit}
          className={`bg-white p-5 rounded-lg mb-5 shadow-sm ${editingId ? "border-2 border-yellow-500" : ""}`}
        >
          {editingId && (
            <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-4 text-sm">
              ✏️ Editing post...
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-2 text-gray-600 text-sm font-medium">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter post title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2 rounded border border-gray-300"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-gray-600 text-sm font-medium">
              {editingId ? "Edit your post" : "What's on your mind?"}
            </label>
            <textarea
              placeholder="Share your thoughts with the community..."
              value={form.post_content}
              onChange={(e) => setForm({ ...form, post_content: e.target.value })}
              className="w-full p-3 rounded border border-gray-300 min-h-[120px] text-sm font-sans resize-y"
              required
            ></textarea>
          </div>

          {role === "admin" && editingId && (
            <div className="mb-4">
              <label className="block mb-2 text-gray-600 text-sm font-medium">
                Post Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-2 rounded border border-gray-300"
              >
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="denied">❌ Denied</option>
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-5 py-2 bg-gray-600 text-white rounded cursor-pointer text-sm font-medium"
            >
              {editingId ? "💾 Update Post" : "📝 Post to Forum"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2 bg-white text-gray-600 border border-gray-600 rounded cursor-pointer text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <h3 className="text-gray-600 text-base mb-4 font-semibold">Recent Posts</h3>

        {forumPosts.length > 0 ? (
          forumPosts.map(f => (
            <div
              key={f.id}
              className="bg-white p-5 rounded-lg mb-3 shadow-sm border border-gray-200"
            >
              <h4 className="m-0 mb-2 text-blue-600">{f.title}</h4>
              <p className="m-0 mb-3 text-gray-800">{f.post_content}</p>
              <small className="block mb-2">
                {f.status === "approved" ? "anonymous" : f.status}
              </small>

              {role === "admin" && (
                <div className="flex gap-2 flex-wrap">
                  {f.status !== "approved" && (
                    <button
                      onClick={() => handleStatusChange(f.id, "approved")}
                      className="px-3 py-1 bg-green-600 text-white rounded cursor-pointer text-xs font-medium"
                    >
                      ✅ Approve
                    </button>
                  )}
                  {f.status !== "denied" && (
                    <button
                      onClick={() => handleStatusChange(f.id, "denied")}
                      className="px-3 py-1 bg-yellow-400 text-gray-800 rounded cursor-pointer text-xs font-medium"
                    >
                      ❌ Deny
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded cursor-pointer text-xs font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-5 rounded-lg text-center">
            No forum posts yet.
          </div>
        )}
      </div>
    </div>
  );
}
