const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const db = require("../db").users;

// REGISTER
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
    const info = stmt.run(username, hashedPassword);

    res.status(201).json({ message: 'User registered' });

  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'User already exists' });
    }
    console.error("Registration error:", err);
    return res.status(500).json({ error: 'Database error during registration' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
    const user = stmt.get(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username }
    });

  } catch (err) {
    console.error("Login error:", err); 
    return res.status(500).json({ error: 'Database error during login' });
  }
});

module.exports = router;