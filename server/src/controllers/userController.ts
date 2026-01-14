import { Request, Response } from 'express';
import prisma from '../services/prisma';
import bcrypt from 'bcryptjs';
import { logAction } from '../services/auditLogService';
import { AuthRequest } from '../middleware/auth';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/token';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'AUDITOR';

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    await logAction(user.id, 'USER_REGISTER', 'User', user.id, { email: user.email }, req);

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Cannot log to DB as no user found, but should log to file/stdout
      console.warn(`Failed login attempt for non-existent user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await logAction(user.id, 'LOGIN_FAILED', 'User', user.id, { reason: 'Invalid password' }, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token (hashed is better, but plain for now as per schema design discussion or hash it if schema supports large strings)
    // We will hash it for security.
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    await logAction(user.id, 'LOGIN_SUCCESS', 'User', user.id, {}, req);

    res.json({ 
      accessToken, 
      refreshToken, 
      user: { id: user.id, email: user.email, role: user.role, name: user.name } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const payload = verifyToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    // Rotate refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedNewRefreshToken },
    });
    
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    // If token reuse detected or other error, we should ideally invalidate all tokens for user (advanced)
    // For now, just return 403
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(204);

  await prisma.user.update({
    where: { id: req.user.userId },
    data: { refreshToken: null },
  });

  res.sendStatus(204);
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'AUDITOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    await logAction(req.user!.userId, 'USER_UPDATE_ROLE', 'User', user.id, { newRole: role }, req);

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user role' });
  }
};
