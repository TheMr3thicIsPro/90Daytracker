const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// In-memory storage for user data (in production, use a proper database)
const userDataStore = {};

// API endpoint to sync user data
app.post('/api/sync', async (req, res) => {
  try {
    const { userId, data } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Store user data
    userDataStore[userId] = {
      data,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({ success: true, message: 'Data synced successfully', userId });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get user data
app.get('/api/sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userData = userDataStore[userId];
    
    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }
    
    res.json({ success: true, data: userData.data });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for all routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});