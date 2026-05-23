import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/sqlite';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

class AuthController {
  // Register a new user
  public register = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        res.status(400).json({ error: 'User with this email already exists' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert user
      const result = await db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );

      // Generate JWT
      const token = jwt.sign(
        { id: result.lastID, email, username },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: result.lastID,
          username,
          email,
        },
      });
    } catch (error: any) {
      console.error('[AUTH] Registration error:', error);
      res.status(500).json({ error: 'Internal server error during registration' });
    }
  };

  // Login existing user
  public login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    try {
      // Find user
      const user = await db.get<any>('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        res.status(400).json({ error: 'Invalid email or password' });
        return;
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(400).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  };

  // Get current user profile
  public me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const user = await db.get<any>(
        'SELECT id, username, email, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (error: any) {
      console.error('[AUTH] Fetch profile error:', error);
      res.status(500).json({ error: 'Internal server error fetching profile' });
    }
  };
}

export const authController = new AuthController();
export default authController;
