require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const authRoutes = require('./routing/auth');
const userRoutes = require('./routing/user');
const projectRoutes = require('./routing/project');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle process termination
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  shutdown();
});

process.on('SIGINT', () => {
  console.info('SIGINT signal received.');
  shutdown();
});

const shutdown = () => {
  console.log('Starting graceful shutdown');
  server.close(async () => {
    console.log('Express server closed');
    try {
      await closeDatabase();
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
};

let server;

initDatabase()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });