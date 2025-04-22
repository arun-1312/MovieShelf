const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "watchlist_user",
    password: "password123",
    database: "movie_watchlist",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("✅ Connected to MySQL Database!");
});

module.exports = db;
