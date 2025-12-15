const express = require('express');
const path = require('path');
const sendRouter = require('./routes/send');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/send', sendRouter);

// Serve index.html for any unmatched routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 404 handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use(errorHandler);

module.exports = app;
