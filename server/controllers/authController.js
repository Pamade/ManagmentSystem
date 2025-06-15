const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => password.length >= 6;
const validateName = (name) => name && name.length >= 3;

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const errors = {};
    if (!validateName(name)) errors.name = 'Name must be at least 3 characters long';
    if (!validateEmail(email)) errors.email = 'Please provide a valid email address';
    if (!validatePassword(password)) errors.password = 'Password must be at least 6 characters long';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const user = new User(name, email, password);
    try {
      const userId = await user.create();
      const JWT_SECRET = process.env.JWT_SECRET;
      const token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: '1h' });

      res.status(201).json({
        token,
        userId: userId.toString(),
        name,
        email
      });
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = {};

    if (!validateEmail(email)) errors.email = 'Please provide a valid email address';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      userId: user._id.toString(),
      name: user.name,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};
