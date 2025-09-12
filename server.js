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
  password: "app1234", // your MySQL password
  database: "feedback_app"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ Connected to MySQL");
});

// ✅ API route to save feedback
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

// Start server
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
