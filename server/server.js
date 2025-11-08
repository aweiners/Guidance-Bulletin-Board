require("dotenv").config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // ✅ For password hashing
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./guidanceDB.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to guidanceDB.db");
    db.run("PRAGMA foreign_keys = ON");
    ensureSchema();
  }
});

function ensureSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    post_content TEXT,
    status TEXT,
    FOREIGN KEY(user_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    title TEXT,
    content TEXT,
    embed_url TEXT,
    FOREIGN KEY(admin_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    title TEXT,
    description TEXT,
    file_url TEXT,
    FOREIGN KEY(admin_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`);
}

// ===== Rate Limit for login =====
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Please try again later." },
});

// ===== JWT Middleware =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ===== LOGIN =====
app.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  db.get(
    "SELECT id, username, role, password FROM accounts WHERE username = ?",
    [username.trim()],
    async (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });

      // ✅ Verify hashed password
      const match = await bcrypt.compare(password.trim(), row.password);
      if (!match)
        return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign(
        { id: row.id, username: row.username, role: row.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        token,
        user: { id: row.id, username: row.username, role: row.role },
      });
    }
  );
});

// ===== ACCOUNTS =====
app.get("/accounts", authenticateToken, adminOnly, (req, res) => {
  db.all("SELECT id, username, role FROM accounts", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/accounts", authenticateToken, adminOnly, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: "All fields required" });

  try {
    const hashed = await bcrypt.hash(password.trim(), 10); // ✅ Hash password
    db.run(
      "INSERT INTO accounts (username, password, role) VALUES (?, ?, ?)",
      [username.trim(), hashed, role.trim()],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
      }
    );
  } catch (hashErr) {
    res.status(500).json({ error: "Password hashing failed" });
  }
});

app.put("/accounts/:id", authenticateToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ error: "All fields required" });

  try {
    const hashed = await bcrypt.hash(password.trim(), 10);
    db.run(
      "UPDATE accounts SET username=?, password=?, role=? WHERE id=?",
      [username.trim(), hashed, role.trim(), id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0)
          return res.status(404).json({ error: "Account not found" });
        res.json({ message: "Updated successfully" });
      }
    );
  } catch (hashErr) {
    res.status(500).json({ error: "Password hashing failed" });
  }
});

app.delete("/accounts/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM accounts WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
});

// ===== ANNOUNCEMENTS =====
app.get("/announcements", (req, res) => {
  db.all("SELECT * FROM announcements", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/announcements", authenticateToken, adminOnly, (req, res) => {
  const admin_id = req.user.id;
  const { title, content, embed_url } = req.body;
  if (!title || !content)
    return res.status(400).json({ error: "Fields required" });

  db.run(
    "INSERT INTO announcements (admin_id, title, content, embed_url) VALUES (?, ?, ?, ?)",
    [admin_id, title.trim(), content.trim(), embed_url || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/announcements/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  const { title, content, embed_url } = req.body;
  db.run(
    "UPDATE announcements SET title=?, content=?, embed_url=? WHERE id=?",
    [title.trim(), content.trim(), embed_url || null, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Announcement not found" });
      res.json({ message: "Updated successfully" });
    }
  );
});

app.delete("/announcements/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM announcements WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
});

// ===== RESOURCES =====
app.get("/resources", (req, res) => {
  db.all("SELECT * FROM resources", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/resources", authenticateToken, adminOnly, (req, res) => {
  const admin_id = req.user.id;
  const { title, description, file_url } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: "Fields required" });

  db.run(
    "INSERT INTO resources (admin_id, title, description, file_url) VALUES (?, ?, ?, ?)",
    [admin_id, title.trim(), description.trim(), file_url || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/resources/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  const { title, description, file_url } = req.body;
  db.run(
    "UPDATE resources SET title=?, description=?, file_url=? WHERE id=?",
    [title.trim(), description.trim(), file_url || null, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Resource not found" });
      res.json({ message: "Updated successfully" });
    }
  );
});

app.delete("/resources/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM resources WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
});

// ===== FORUM POSTS =====
app.get("/forum_posts", authenticateToken, (req, res) => {
  if (req.user.role === "admin") {
    db.all("SELECT * FROM forum_posts", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } else {
    db.all("SELECT * FROM forum_posts WHERE status='approved'", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.post("/forum_posts", authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const { title, post_content } = req.body;
  if (!title || !post_content)
    return res.status(400).json({ error: "Title and content required" });

  db.run(
    "INSERT INTO forum_posts (user_id, title, post_content, status) VALUES (?, ?, ?, 'pending')",
    [user_id, title.trim(), post_content.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, status: "pending" });
    }
  );
});

app.put("/forum_posts/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  const { user_id, title, post_content, status } = req.body;
  if (!title || !post_content || !status)
    return res.status(400).json({ error: "Required fields missing" });

  db.run(
    "UPDATE forum_posts SET user_id=?, title=?, post_content=?, status=? WHERE id=?",
    [user_id, title.trim(), post_content.trim(), status.trim(), id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Updated successfully" });
    }
  );
});

app.delete("/forum_posts/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM forum_posts WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Frontend allowed: ALL origins (dev mode)`);
});
