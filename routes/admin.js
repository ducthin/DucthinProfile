const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin credentials (in production, these should be in a secure database)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '$2a$10$YEX2iLR8pnHqKvhSQVM5XOv85RkHU4C33InYGGlXrDJBbJCrw2Wdu';
const JWT_SECRET = 'f7af71d4-2262-4f41-b379-14285a570dd0';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Admin login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate admin credentials
  if (username !== ADMIN_USERNAME) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, ADMIN_PASSWORD);
  if (!validPassword) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Create and assign token
  const token = jwt.sign({ id: 'admin' }, JWT_SECRET);
  res.header('auth-token', token).json({
    token,
    message: 'Logged in successfully'
  });
});

// Protected admin routes
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to admin dashboard' });
});

// Update profile information
router.put('/profile', authenticateToken, (req, res) => {
  // Here you would typically update profile information in a database
  const { name, about, skills } = req.body;
  // For now, we'll just send a success response
  res.json({ message: 'Profile updated successfully' });
});

// Update projects
router.put('/projects', authenticateToken, (req, res) => {
  const { projects } = req.body;
  // Here you would update projects in a database
  res.json({ message: 'Projects updated successfully' });
});

// Get contact form submissions
router.get('/contact-submissions', authenticateToken, (req, res) => {
  // Here you would fetch contact form submissions from a database
  res.json({
    submissions: [
      // Sample data
      { id: 1, name: 'John Smith', email: 'john@example.com', message: 'Hello', date: new Date() }
    ]
  });
});

module.exports = router;