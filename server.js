const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = 3000;

// 1. CONNECT TO REAL DATABASE (Creates notes.db automatically)
const db = new DatabaseSync(path.join(__dirname, 'notes.db'));

// Create the 'notes' table if it doesn't exist yet
db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL
    ) STRICT;
`);

// Add 1 starter note only if the database table is empty
const count = db.prepare('SELECT COUNT(*) AS total FROM notes').get().total;
if (count === 0) {
    db.prepare('INSERT INTO notes (text) VALUES (?)').run('Learn how HTTP, Express, and SQLite work');
}

// Prepare reusable SQL queries (Fast & prevents SQL Injection attacks)
const getAllNotes = db.prepare('SELECT id, text FROM notes');
const insertNote = db.prepare('INSERT INTO notes (text) VALUES (?)');
const updateNote = db.prepare('UPDATE notes SET text = ? WHERE id = ?');
const deleteNote = db.prepare('DELETE FROM notes WHERE id = ?');

// Middleware
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

function validateNote(req, res, next) {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: "Note text is required and cannot be empty" });
    }
    req.body.text = text.trim();
    next();
}

// 2. ROUTES USING REAL SQL QUERIES

// READ all notes from database
app.get('/api/notes', (req, res) => {
    const notes = getAllNotes.all();
    res.json(notes);
});

// CREATE a new note in database
app.post('/api/notes', validateNote, (req, res) => {
    const result = insertNote.run(req.body.text);
    const newNote = { 
        id: Number(result.lastInsertRowid), 
        text: req.body.text 
    };
    res.status(201).json(newNote);
});

// UPDATE an existing note in database
app.put('/api/notes/:id', validateNote, (req, res) => {
    const id = Number(req.params.id);
    const result = updateNote.run(req.body.text, id);

    // result.changes tells us how many rows were actually updated
    if (result.changes === 0) {
        return res.status(404).json({ error: "Note not found" });
    }

    res.json({ id, text: req.body.text });
});

// DELETE a note from database
app.delete('/api/notes/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = deleteNote.run(id);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);
    res.status(400).json({ error: "Invalid JSON format sent in request" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
