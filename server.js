// app.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();

// Database connection
const db = new sqlite3.Database('db.sql');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Root route
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'routes', 'login.html'));
});

// Authentication routes
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              res.status(400).json({ error: 'Username already exists' });
            } else {
              res.status(500).json({ error: 'Server error' });
            }
            return;
          }
          res.json({ id: this.lastID });
        });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      res.status(500).json({ error: 'Server error' });
      return;
    }
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.userId = user.id;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Task routes
app.post('/api/tasks', isAuthenticated, (req, res) => {
  const { date, period, content } = req.body;
  const userId = req.session.userId;

  db.run('INSERT INTO tasks (user_id, date, period, content) VALUES (?, ?, ?, ?)',
      [userId, date, period, content],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Server error' });
          return;
        }
        res.json({ id: this.lastID });
      });
});

app.get('/api/tasks/:weekStart', isAuthenticated, (req, res) => {
  const userId = req.session.userId;
  const weekStart = req.params.weekStart;

  db.all(`SELECT * FROM tasks 
            WHERE user_id = ? 
            AND date >= date(?) 
            AND date < date(?, '+7 days')`,
      [userId, weekStart, weekStart],
      (err, tasks) => {
        if (err) {
          res.status(500).json({ error: 'Server error' });
          return;
        }
        res.json(tasks);
      });
});

// Project routes
app.post('/api/projects', isAuthenticated, (req, res) => {
  const { name, deadline, content } = req.body;
  const userId = req.session.userId;

  db.run('INSERT INTO projects (user_id, name, deadline, content) VALUES (?, ?, ?, ?)',
      [userId, name, deadline, content],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Server error' });
          return;
        }
        res.json({ id: this.lastID });
      });
});

app.get('/api/projects', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  db.all(`SELECT * FROM projects 
            WHERE user_id = ? 
            AND deadline >= date('now')
            ORDER BY deadline ASC LIMIT 5`,
      [userId],
      (err, projects) => {
        if (err) {
          res.status(500).json({ error: 'Server error' });
          return;
        }
        res.json(projects);
      });
});

app.put('/api/projects/:id', isAuthenticated, (req, res) => {
  const { name, deadline, content } = req.body;
  const projectId = req.params.id;
  const userId = req.session.userId;

  db.run(`UPDATE projects 
            SET name = ?, deadline = ?, content = ? 
            WHERE id = ? AND user_id = ?`,
      [name, deadline, content, projectId, userId],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Server error' });
          return;
        }
        res.json({ success: true });
      });
});

app.delete('/api/projects/:id', isAuthenticated, (req, res) => {
  const projectId = req.params.id;
  const userId = req.session.userId;

  db.run('DELETE FROM projects WHERE id = ? AND user_id = ?',
      [projectId, userId],
      function(err) {
        if (err) {
          res.status(500).json({ error: 'Server error' });
          return;
        }
        res.json({ success: true });
      });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;