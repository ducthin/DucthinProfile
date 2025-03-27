require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Verify environment variables are loaded
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// Debug log to check if env variables are loaded
console.log('Environment variables loaded:', {
  username: ADMIN_USERNAME,
  passwordHash: ADMIN_PASSWORD && ADMIN_PASSWORD.substring(0, 10) + '...',
  hasJwtSecret: !!JWT_SECRET
});

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
  
  // Debug logs
  console.log('Login attempt:', { 
    attemptedUsername: username,
    correctUsername: ADMIN_USERNAME,
    usernameMatch: username === ADMIN_USERNAME 
  });

  // Validate admin credentials
  if (username !== ADMIN_USERNAME) {
    return res.status(400).json({ message: 'Invalid credentials (username)' });
  }

  // Verify password with debug
  const validPassword = await bcrypt.compare(password, ADMIN_PASSWORD);
  console.log('Password verification:', {
    passwordProvided: !!password,
    passwordHashExists: !!ADMIN_PASSWORD,
    passwordValid: validPassword
  });

  if (!validPassword) {
    return res.status(400).json({ message: 'Invalid credentials (password)' });
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
  try {
    const fs = require('fs');
    const path = require('path');
    const { name, about, skills, imageUrl } = req.body;
    
    // Đường dẫn đến file profile.json
    const PROFILE_PATH = path.join(__dirname, '..', 'data', 'profile.json');
    
    // Tạo đối tượng profile mới
    const profileData = {
      name,
      about,
      skills,
      imageUrl: imageUrl || ''
    };
    
    // Ghi dữ liệu vào file
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(profileData, null, 2));
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update projects
router.put('/projects', authenticateToken, (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { projects } = req.body;
    
    // Đường dẫn đến file projects.json
    const PROJECTS_FILE = path.join(__dirname, '..', 'data', 'projects.json');
    
    // Ghi dữ liệu vào file
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    
    res.json({ message: 'Projects updated successfully' });
  } catch (error) {
    console.error('Error updating projects:', error);
    res.status(500).json({ message: 'Failed to update projects' });
  }
});

// Get contact form submissions
router.get('/contact-submissions', authenticateToken, (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Đường dẫn đến file contacts.json
    const CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contacts.json');
    
    // Đọc dữ liệu từ file
    let submissions = [];
    if (fs.existsSync(CONTACTS_FILE)) {
      submissions = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    }
    
    res.json({ submissions });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({ message: 'Failed to fetch contact submissions' });
  }
});

module.exports = router;