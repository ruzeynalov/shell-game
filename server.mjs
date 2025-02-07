// server.mjs
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Redis from 'ioredis';
import crypto from 'crypto';

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ioredis client setup
const redisClient = new Redis("rediss://:p64efc76d71d932225353f32f6accc20514acbb73df5b3c540c8f989437356d92@ec2-3-218-212-254.compute-1.amazonaws.com:10230", {
  tls: {
    rejectUnauthorized: false,
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Redis keys
const RESULTS_KEY = 'results';
const USERS_KEY = 'users';
const SESSION_KEY = 'current_session';
const WAITING_LIST_KEY = 'waiting_list';

// Initialize Redis data structures
(async () => {
  const exists = await redisClient.exists(RESULTS_KEY);
  if (!exists) {
    await redisClient.set(RESULTS_KEY, JSON.stringify([]));
  }
  
  // Initialize session if doesn't exist
  const sessionExists = await redisClient.exists(SESSION_KEY);
  if (!sessionExists) {
    await redisClient.set(SESSION_KEY, JSON.stringify({
      active: false,
      players: [],
      currentPlayerIndex: 0,
      ballPosition: null,
      attemptsUsed: 0
    }));
  }
  
  // Initialize waiting list if doesn't exist
  const waitingListExists = await redisClient.exists(WAITING_LIST_KEY);
  if (!waitingListExists) {
    await redisClient.set(WAITING_LIST_KEY, JSON.stringify([]));
  }
})();

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send('Username and password required');
    }

    const users = JSON.parse(await redisClient.get(USERS_KEY) || '{}');
    
    if (users[username]) {
      return res.status(400).send('Username already exists');
    }

    users[username] = {
      passwordHash: hashPassword(password),
      wins: 0
    };

    await redisClient.set(USERS_KEY, JSON.stringify(users));
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(await redisClient.get(USERS_KEY) || '{}');
    
    if (!users[username] || users[username].passwordHash !== hashPassword(password)) {
      return res.status(401).send('Invalid credentials');
    }

    res.json({ username, wins: users[username].wins });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});

// Join waiting list
app.post('/api/join-waiting-list', async (req, res) => {
  try {
    const { username } = req.body;
    const waitingList = JSON.parse(await redisClient.get(WAITING_LIST_KEY));
    const session = JSON.parse(await redisClient.get(SESSION_KEY));
    
    // Check if user is already in waiting list or session
    if (waitingList.includes(username) || session.players.includes(username)) {
      return res.status(400).send('Already in waiting list or session');
    }
    
    waitingList.push(username);
    await redisClient.set(WAITING_LIST_KEY, JSON.stringify(waitingList));
    
    // If we have 3 players and no active session, start a new session
    if (waitingList.length >= 3 && !session.active) {
      await startNewSession();
    }
    
    res.json({ position: waitingList.length });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error joining waiting list');
  }
});

// Get current session state
app.get('/api/session', async (req, res) => {
  try {
    const session = JSON.parse(await redisClient.get(SESSION_KEY));
    const waitingList = JSON.parse(await redisClient.get(WAITING_LIST_KEY));
    res.json({ session, waitingList });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error getting session state');
  }
});

// Make a guess in the current session
app.post('/api/guess', async (req, res) => {
  try {
    const { username, planetIndex } = req.body;
    const session = JSON.parse(await redisClient.get(SESSION_KEY));
    
    if (!session.active || session.players[session.currentPlayerIndex] !== username) {
      return res.status(400).send('Not your turn or no active session');
    }
    
    const correct = planetIndex === session.ballPosition;
    
    if (correct) {
      // Player won
      await handleWin(username);
      res.json({ correct, gameOver: true, winner: username });
    } else {
      session.attemptsUsed++;
      if (session.attemptsUsed >= 2) {
        // Last player wins automatically
        const winner = session.players[2];
        await handleWin(winner);
        res.json({ correct: false, gameOver: true, winner });
      } else {
        // Move to next player
        session.currentPlayerIndex++;
        await redisClient.set(SESSION_KEY, JSON.stringify(session));
        res.json({ correct: false, gameOver: false });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing guess');
  }
});

async function handleWin(username) {
  // Update user's wins
  const users = JSON.parse(await redisClient.get(USERS_KEY));
  users[username].wins++;
  await redisClient.set(USERS_KEY, JSON.stringify(users));
  
  // Reset session
  await redisClient.set(SESSION_KEY, JSON.stringify({
    active: false,
    players: [],
    currentPlayerIndex: 0,
    ballPosition: null,
    attemptsUsed: 0
  }));
  
  // Start new session if enough players waiting
  const waitingList = JSON.parse(await redisClient.get(WAITING_LIST_KEY));
  if (waitingList.length >= 3) {
    await startNewSession();
  }
}

async function startNewSession() {
  try {
    const waitingList = JSON.parse(await redisClient.get(WAITING_LIST_KEY));
    const players = waitingList.slice(0, 3);
    
    // Remove players from waiting list
    await redisClient.set(WAITING_LIST_KEY, JSON.stringify(waitingList.slice(3)));
    
    // Shuffle players for random order
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }
    
    // Create new session
    const session = {
      active: true,
      players,
      currentPlayerIndex: 0,
      ballPosition: Math.floor(Math.random() * 3),
      attemptsUsed: 0
    };
    
    await redisClient.set(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Error starting new session:', err);
  }
}

// Routes
app.get('/api/results', async (req, res) => {
  try {
    const data = await redisClient.get(RESULTS_KEY);
    const results = JSON.parse(data) || [];
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching results');
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const { username, outcome } = req.body;
    if (!username || !outcome) {
      return res.status(400).send('Invalid data');
    }

    const newResult = { username, outcome, timestamp: new Date().toISOString() };
    const data = await redisClient.get(RESULTS_KEY);
    const results = JSON.parse(data) || [];

    results.push(newResult);
    await redisClient.set(RESULTS_KEY, JSON.stringify(results));

    res.status(201).json(newResult);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving result');
  }
});

// Leaderboard route
app.get('/api/leaderboard', async (req, res) => {
  try {
    const data = await redisClient.get(RESULTS_KEY);
    const results = JSON.parse(data) || [];

    // Tally wins for each username
    const tallies = {};
    for (const entry of results) {
      const { username, outcome } = entry;
      if (!tallies[username]) {
        tallies[username] = { username, wins: 0 };
      }
      if (outcome === 'win') {
        tallies[username].wins++;
      }
    }

    // Convert tallies to an array and sort by wins descending
    const leaderboard = Object.values(tallies).sort((a, b) => b.wins - a.wins);
    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching leaderboard');
  }
});

// 3) Optionally serve your React build
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
