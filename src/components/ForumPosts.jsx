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
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "40px 20px", textAlign: "center" }}>
          <h2 style={{ color: "#856404", marginTop: 0, fontSize: "24px" }}>🔒 Forum Access Restricted</h2>
          <p style={{ color: "#856404", fontSize: "16px" }}>You must log in to view and post in the forum.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "20px" }}>
        <form onSubmit={handleSubmit} style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          border: editingId ? "2px solid #ffc107" : "none"
        }}>
          {editingId && (
            <div style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              fontSize: "14px"
            }}>
              ✏️ Editing post...
            </div>
          )}

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#555", fontSize: "14px", fontWeight: "500" }}>
              Title
            </label>
            <input
              type="text"
              placeholder="Enter post title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#555", fontSize: "14px", fontWeight: "500" }}>
              {editingId ? "Edit your post" : "What's on your mind?"}
            </label>
            <textarea
              placeholder="Share your thoughts with the community..."
              value={form.post_content}
              onChange={(e) => setForm({ ...form, post_content: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                minHeight: "120px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical"
              }}
              required
            ></textarea>
          </div>

          {role === "admin" && editingId && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#555",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Post Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  boxSizing: "border-box"
                }}>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="denied">❌ Denied</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {editingId ? "💾 Update Post" : "📝 Post to Forum"}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={{
                padding: "10px 20px",
                backgroundColor: "white",
                color: "#6c757d",
                border: "1px solid #6c757d",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Posts List */}
        <h3 style={{ color: "#555", fontSize: "16px", marginBottom: "15px", fontWeight: "600" }}>
          Recent Posts
        </h3>

        {forumPosts.length > 0 ? (
          forumPosts.map(f => (
            <div key={f.id} style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e9ecef"
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#007bff" }}>{f.title}</h4>
              <p style={{ margin: "0 0 15px 0", color: "#333" }}>{f.post_content}</p>
              
              {/* CHANGE: Approved status will show as "anonymous" */}
              <small style={{ display: "block", marginBottom: "10px" }}>
                {f.status === "approved" ? "anonymous" : f.status}
              </small>

              {role === "admin" && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {f.status !== "approved" && (
                    <button
                      onClick={() => handleStatusChange(f.id, "approved")}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}
                    >
                      ✅ Approve
                    </button>
                  )}
                  {f.status !== "denied" && (
                    <button
                      onClick={() => handleStatusChange(f.id, "denied")}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ffc107",
                        color: "#333",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}
                    >
                      ❌ Deny
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(f.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "6px", textAlign: "center" }}>
            No forum posts yet.
          </div>
        )}
      </div>
    </div>
  );
}
