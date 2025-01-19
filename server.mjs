/**
 * server.js
 * Run with: npm run server
 */
import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path';

// Create server
const app = express();
app.use(cors());
app.use(express.json());

// Setup lowdb
const file = path.join(__dirname, 'db.json'); 
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize the DB data if not present
async function initDB() {
  await db.read();
  db.data = db.data || { results: [] }; 
  await db.write();
}
initDB();

// GET all results
app.get('/api/results', async (req, res) => {
  await db.read();
  res.json(db.data.results);
});

// POST new result (win/lose)
app.post('/api/results', async (req, res) => {
  const { username, outcome } = req.body; 
  if (!username || !outcome) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  await db.read();
  db.data.results.push({
    username,
    outcome,
    timestamp: new Date().toISOString()
  });
  await db.write();
  res.status(201).json({ message: 'Result saved' });
});

// Start server on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
