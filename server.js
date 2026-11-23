const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

let notes = [
    { id: 1, text: "Learn how HTTP and GET POST work" }
];

// 1. READ all notes
app.get('/api/notes', (req, res) => {
    res.json(notes);
});

// 2. CREATE a new note
app.post('/api/notes', (req, res) => {
    const newNote = { id: Date.now(), text: req.body.text };
    notes.push(newNote);
    res.status(201).json(newNote);
});

// 3. UPDATE an existing note (NEW!)
app.put('/api/notes/:id', (req, res) => {
    const id = Number(req.params.id); // Grab :id from URL and convert string to number
    const note = notes.find(n => n.id === id);

    if (!note) {
        return res.status(404).json({ error: "Note not found" });
    }

    note.text = req.body.text;
    res.json(note);
});

// 4. DELETE a note (NEW!)
app.delete('/api/notes/:id', (req, res) => {
    const id = Number(req.params.id);
    const initialLength = notes.length;

    // Keep every note EXCEPT the one matching the ID
    notes = notes.filter(n => n.id !== id);

    if (notes.length === initialLength) {
        return res.status(404).json({ error: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

