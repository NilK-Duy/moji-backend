import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session';

const ACCESS_TOKEN_TTL = '30m'; // nomally 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      res.status(400).json({ message: "All fields are required: username, password, email, firstName, lastName" });
      return;
    }

    // Check if the username or email already exists
    const duplicateUser = await User.findOne({ username  });

    if (duplicateUser) {
      res.status(409).json({ message: "Username already exists." });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // salt rounds = 10

    // Create the user in the database
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`
    });

    // return
    res.status(204).send();
    return;

  } catch (error) {
    console.error("Error during sign-up:", error)
    res.status(500).json({ message: "Internal server error." });
    return;
  }
}

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    // inputs
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "Username and password are required." });
      return;
    }

    // compare hashed password
    const user = await User.findOne({ username });

    if (!user) {
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }

    // check password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }

    // create access token with JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // create refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');

    // create new session to store refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
    });

    // return refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: REFRESH_TOKEN_TTL
    });

    // return access token
    res.status(200).json({ message: `User ${user.displayName} logged in successfully.`, accessToken });

  } catch (error) {
    console.error("Error during sign-in:", error)
    res.status(500).json({ message: "Internal server error." });
    return;
  }
}

export const signOut = async (req: Request, res: Response): Promise<void> => {
  try {
    // get refresh token from cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      // delete session from database
      await Session.deleteOne({ refreshToken: token });

    // remove cookie
      res.clearCookie('refreshToken');
    }

    // return
    res.status(204).send();
  } catch (error) {
    console.error("Error during sign-out:", error)
    res.status(500).json({ message: "Internal server error." });
  }
}
