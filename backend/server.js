
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://127.0.0.1:5500"
  }));
  
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Vinoraj@23",
    database: process.env.DB_NAME || "movie_watchlist"
});

db.connect(err => {
    if (err) {
        console.error("❌ Database Connection Failed!", err);
    } else {
        console.log("✅ Connected to MySQL Database");
    }
});

// Register a New User
app.post("/auth/register", async (req, res) => {
    const { username, userpassword } = req.body;

    if (!username || !userpassword) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Check if user exists
        const checkQuery = "SELECT * FROM users WHERE username = ?";
        db.query(checkQuery, [username], async (err, results) => {
            if (err) {
                console.error("❌ Error checking user:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: "Username already exists" });
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userpassword, saltRounds);

            // Insert user
            const insertQuery = "INSERT INTO users (username, userpassword) VALUES (?, ?)";
            db.query(insertQuery, [username, hashedPassword], (err, result) => {
                if (err) {
                    console.error("❌ Error inserting user:", err);
                    return res.status(500).json({ error: "Database error" });
                }

                return res.status(201).json({ success: true, message: "User registered successfully" });
            });
        });
    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Login Endpoint
app.post("/auth/login", (req, res) => {
    const { username, userpassword } = req.body;

    // Check if username and password are provided
    if (!username || !userpassword) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // Check if user exists in the database
    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length > 0) {
            const match = await bcrypt.compare(userpassword, results[0].userpassword);
            if (match) {
                res.json({ success: true, message: "Login successful", data: { username } });
            } else {
                res.status(401).json({ error: "Invalid credentials" });
            }
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});
// Create a New Watchlist
app.post("/watchlists", (req, res) => {
    console.log("📩 Received Body:", req.body);

    const { username, watchlistName } = req.body;

    if (!username || !watchlistName) {
        return res.status(400).json({ error: "Username and watchlist name are required" });
    }

    const query = "INSERT INTO watchlists (username, watchlistName) VALUES (?, ?)";
    db.query(query, [username, watchlistName], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: "Watchlist created successfully!" });
    });
});

// Fetch Watchlists for a User
app.get("/watchlists", (req, res) => {
    const { username } = req.query;

    console.log("📩 Received GET /watchlists request with username:", username);

    if (!username) {
        return res.status(400).json({ error: "❌ Username is required" });
    }

    db.query("SELECT * FROM watchlists WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        console.log("✅ Watchlists Retrieved:", results);
        res.json(results || []); // Ensure an array is returned, even if empty
    });
});

// Add a Movie to a Watchlist
app.post("/movies", (req, res) => {
    const { username, watchlistName, name, genre, review, description, platform } = req.body;

    console.log("📩 Received Body:", req.body); // Debugging line

    if (!username || !watchlistName || !name || !genre || !platform) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const query = "INSERT INTO movies (username, watchlistName, name, genre, review, description, platform) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(query, [username, watchlistName, name, genre, review, description, platform], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: "Movie added successfully!" });
    });
});

// Fetch Movies for a Watchlist
app.get("/movies", (req, res) => {
    const { username, watchlistName } = req.query;

    if (!username || !watchlistName) {
        return res.status(400).json({ error: "Username and watchlist name are required" });
    }

    const query = "SELECT * FROM movies WHERE username = ? AND watchlistName = ?";
    db.query(query, [username, watchlistName], (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        console.log("✅ Movies Retrieved:", results);
        // Wrap results in a JSON object
        res.json({ success: true, data: results || [] });
    });
});


app.delete("/movies", (req, res) => {
    const { username, watchlistName, movieName } = req.body;

    if (!username || !watchlistName || !movieName) {
        return res.status(400).json({ error: "Username, watchlist name, and movie name are required" });
    }

    const query = "DELETE FROM movies WHERE username = ? AND watchlistName = ? AND name = ?";
    db.query(query, [username, watchlistName, movieName], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Movie not found" });
        }

        res.json({ success: true, message: "Movie deleted successfully!" });
    });
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}...`);
});