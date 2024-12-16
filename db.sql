-- Users Table
CREATE TABLE users (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       username TEXT UNIQUE NOT NULL,
                       password TEXT NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       user_id INTEGER NOT NULL,
                       date DATE NOT NULL,
                       period TEXT NOT NULL,  -- 'morning', 'noon', 'night'
                       content TEXT,
                       FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Projects Table
CREATE TABLE projects (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          user_id INTEGER NOT NULL,
                          name TEXT NOT NULL,
                          deadline DATE NOT NULL,
                          content TEXT,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (user_id) REFERENCES users(id)
);