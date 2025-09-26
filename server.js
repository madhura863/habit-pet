// const express = require("express");
// const mysql = require("mysql2");
// const bodyParser = require("body-parser");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // ✅ Connect to MySQL
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "appuser",        // your MySQL username
//   password: "app1234", // your MySQL password
//   database: "feedback_app"
// });

// db.connect(err => {
//   if (err) throw err;
//   console.log("✅ Connected to MySQL");
// });

// // ✅ API route to save feedback
// app.post("/feedback", (req, res) => {
//   const { rating, experience, bug, feature } = req.body;

//   const sql = "INSERT INTO feedback (rating, experience, bug, feature) VALUES (?, ?, ?, ?)";
//   db.query(sql, [rating, experience, bug, feature], (err, result) => {
//     if (err) {
//       return res.status(500).send("❌ Database error");
//     }
//     res.send("✅ Feedback saved!");
//   });
// });

// // Start server
// app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));



const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "appuser",        // your MySQL username
  password: "app1234",    // your MySQL password
  database: "feedback_app"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ Connected to MySQL");
});

// =====================
// FEEDBACK ROUTE
// =====================
app.post("/feedback", (req, res) => {
  const { rating, experience, bug, feature } = req.body;

  const sql = "INSERT INTO feedback (rating, experience, bug, feature) VALUES (?, ?, ?, ?)";
  db.query(sql, [rating, experience, bug, feature], (err, result) => {
    if (err) {
      return res.status(500).send("❌ Database error");
    }
    res.send("✅ Feedback saved!");
  });
});

// =====================
// USER REGISTRATION ROUTE
// =====================
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, password], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "❌ DB Error", error: err });
    }
    res.status(201).json({ message: "✅ User registered successfully!" });
  });
});

// =====================
// START SERVER
// =====================

// =====================
// USER LOGIN ROUTE
// =====================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "❌ DB Error", error: err });
    }

    if (results.length > 0) {
      res.status(200).json({ message: "✅ Login successful" });
    } else {
      res.status(401).json({ message: "❌ Invalid email or password" });
    }
  });
});

// =====================
// EDIT EMAIL ROUTE
// =====================
app.post("/edit-email", (req, res) => {
  const { userId, newEmail } = req.body;

  if (!userId || !newEmail) {
    return res.status(400).json({ message: "User ID and new email required" });
  }

  const sql = "UPDATE users SET email = ? WHERE id = ?";
  db.query(sql, [newEmail, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "❌ DB Error", error: err });
    res.json({ message: "✅ Email updated successfully", email: newEmail });
  });
});

const bcrypt = require("bcrypt"); // add at the top with other requires

// =====================
// CHANGE PASSWORD ROUTE
// =====================
app.post("/change-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Invalid input or password too short" });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = "UPDATE users SET password = ? WHERE id = ?";
    db.query(sql, [hashedPassword, userId], (err, result) => {
      if (err) return res.status(500).json({ message: "❌ DB Error", error: err });
      res.json({ message: "✅ Password updated successfully" });
    });
  } catch (err) {
    res.status(500).json({ message: "❌ Error hashing password", error: err.message });
  }
});

app.post("/api/update-email", (req, res) => {
  const { userId, newEmail } = req.body;
  if (!newEmail || !newEmail.includes("@")) return res.status(400).json({ error: "Invalid email" });

  db.query("UPDATE users SET email = ? WHERE id = ?", [newEmail, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, newEmail });
  });
});

// --------------------
// Update password
// --------------------
app.post("/api/update-password", async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Password too short" });

  // get current password hash
  db.query("SELECT password FROM users WHERE id = ?", [userId], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(oldPassword, results[0].password);
    if (!match) return res.status(400).json({ error: "Old password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});


app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
