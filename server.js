const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const db = new sqlite3.Database(':memory:');

// Your existing routes and logic here

const participants = ['elisa', 'fabian', 'ahmed', 'tuulia', 'karla', 'marc'];

app.use(bodyParser.json());
app.use(express.static('public'));

db.serialize(() => {
    db.run("CREATE TABLE secret_santa (id INTEGER PRIMARY KEY, name TEXT)");
});

app.post('/submit', (req, res) => {
    const name = req.body.name;
    if (!participants.includes(name)) {
        return res.json({ message: 'Invalid name' });
    }
    db.get("SELECT name FROM secret_santa WHERE name = ?", [name], (err, row) => {
        if (row) {
            return res.json({ message: 'Name already submitted' });
        }
        db.run("INSERT INTO secret_santa (name) VALUES (?)", [name], function (err) {
            if (err) {
                return res.json({ message: 'Error saving name' });
            }
            res.json({ message: 'Name saved successfully' });
        });
    });
});

app.get('/reveal', (req, res) => {
    db.all("SELECT name FROM secret_santa", [], (err, rows) => {
        if (err) {
            return res.json({ message: 'Error retrieving names' });
        }
        if (rows.length < 5) {
            return res.json({ message: 'Not enough participants yet' });
        }
        const submittedNames = rows.map(row => row.name);
        const remainingNames = participants.filter(name => !submittedNames.includes(name));
        if (remainingNames.length !== 1) {
            return res.json({ message: 'Error determining Secret Santa' });
        }
        const secretSanta = remainingNames[0];
        res.json({ message: `You should give a gift to: ${secretSanta}` });
    });
});

// Add a new endpoint to get the count of submitted names
app.get('/count', (req, res) => {
    db.get("SELECT COUNT(*) as count FROM secret_santa", [], (err, row) => {
        if (err) {
            return res.json({ message: 'Error retrieving count' });
        }
        res.json({ count: row.count });
    });
});

// Add a new endpoint to delete all submitted names
app.post('/reset', (req, res) => {
    db.run("DELETE FROM secret_santa", [], (err) => {
        if (err) {
            return res.json({ message: 'Error resetting names' });
        }
        res.json({ message: 'All names have been reset' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});