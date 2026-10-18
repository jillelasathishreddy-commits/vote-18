import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_matdata_voter_2026_xyz';
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || 'ECI-ADMIN-2026';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', mobile = '', adminCode = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Role check
    const normalizedRole = role.toLowerCase() === 'admin' ? 'admin' : 'user';
    if (normalizedRole === 'admin') {
      if (adminCode && adminCode.trim() !== ADMIN_INVITE_CODE) {
        return res.status(400).json({
          success: false,
          message: `Invalid Admin Authorization Code. For demo testing, use code: ${ADMIN_INVITE_CODE}`,
        });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: normalizedRole,
      mobile,
    });

    await newUser.save();

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: `Account created successfully with ${normalizedRole.toUpperCase()} privileges!`,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        mobile: newUser.mobile,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Role verification: verify role chosen on login page matches account
    if (expectedRole && expectedRole.toLowerCase() !== user.role) {
      return res.status(403).json({
        success: false,
        message: `Role mismatch: This account is registered as '${user.role.toUpperCase()}', but you selected '${expectedRole.toUpperCase()}'. Please switch the role toggle to proceed.`,
        accountRole: user.role,
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Logged in successfully as ${user.role.toUpperCase()}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mobile: req.user.mobile,
    },
  });
});

export default router;
