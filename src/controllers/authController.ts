import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { authValidation } from '../utils/validation';

// Generate JWT Token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN ? process.env.JWT_EXPIRES_IN : '7d';
  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
};

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { error, value } = authValidation.register.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, email, password, firstName, lastName } = value;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    const user = new User({
      username,
      email,
      password,
      profile: {
        firstName,
        lastName
      }
    });

    await user.save();

    const typedUser = user as typeof user & { _id: any };
    const token = generateToken(typedUser._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: (user._id as string | { toString(): string }).toString(),
          username: user.username,
          email: user.email,
          profile: user.profile,
          subscription: user.subscription
        }
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = authValidation.login.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    const userDoc = await User.findOne({ email }).select('+password');
    const user = userDoc as (typeof User.prototype & { 
      _id: any, 
      username: string, 
      email: string, 
      profile: any, 
      subscription: any, 
      comparePassword: (password: string) => Promise<boolean> 
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          profile: user.profile,
          subscription: user.subscription
        }
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// GET PROFILE
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user! as {
      _id: any;
      username: string;
      email: string;
      profile: any;
      subscription: any;
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          profile: user.profile,
          subscription: user.subscription
        }
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { firstName, lastName, studyGoals, preferences } = req.body;

    const updateData: any = {};
    
    if (firstName !== undefined) updateData['profile.firstName'] = firstName;
    if (lastName !== undefined) updateData['profile.lastName'] = lastName;
    if (studyGoals !== undefined) updateData['profile.studyGoals'] = studyGoals;
    if (preferences !== undefined) {
      if (preferences.aiPersonality) updateData['profile.preferences.aiPersonality'] = preferences.aiPersonality;
      if (preferences.difficultyLevel) updateData['profile.preferences.difficultyLevel'] = preferences.difficultyLevel;
      if (preferences.studyReminders !== undefined) updateData['profile.preferences.studyReminders'] = preferences.studyReminders;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// GET USAGE STATS
export const getUsageStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const user = await User.findById(userId);

    const limits = {
      free: {
        aiQueries: 50,
        pdfUploads: 5,
        imagesGenerated: 10
      },
      premium: {
        aiQueries: -1,
        pdfUploads: -1,
        imagesGenerated: -1
      }
    };

    const currentLimits = limits[user!.subscription.plan];

    res.json({
      success: true,
      data: {
        usage: user!.subscription.usage,
        limits: currentLimits,
        plan: user!.subscription.plan
      }
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
};
