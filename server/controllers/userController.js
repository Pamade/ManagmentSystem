const User = require('../models/User');


const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validateName = (name) => {
  return name && name.length >= 3;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    
    const errors = {};

    if (!validateName(name)) {
      errors.name = 'Name must be at least 3 characters long';
    }

    if (!validateEmail(email)) {
      errors.email = 'Please provide a valid email address';
    }

    if (!validatePassword(password)) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Validation failed',
        errors 
      });
    }

    const user = new User(name, email, password);
    
    try {
      await user.create();
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully'
      });
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          status: 'error',
          message: 'Registration failed',
          errors: {
            email: 'This email is already registered'
          }
        });
      }
      throw error; 
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const errors = {};

    if (!validateEmail(email)) {
      errors.email = 'Please provide a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication failed',
        errors: {
          email: 'No account found with this email'
        }
      });
    }

    const isValidPassword = await User.validatePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication failed',
        errors: {
          password: 'Invalid password'
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

