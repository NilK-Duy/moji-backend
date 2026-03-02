import jwt from "jsonwebtoken";
import User from "../models/User";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protectedRoute = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      res.status(401).json({ message: "No token provided" })
      return
    }

    // Verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, async (err, decoded) => {
      if (err) {
        console.error(err)
        res.status(401).json({ message: "Invalid token or expired" })
        return
      }

      // Type assertion for decoded JWT payload
      const decodedUser = decoded as jwt.JwtPayload;

      // Find user by id
      const user = await User.findById(decodedUser?.userId).select('-hashedPassword')

      if (!user) {
        res.status(401).json({ message: "User not found" })
        return
      }

      // Attach user to request object
      req.user = user
      next()
    })

  } catch (error) {
    res.status(401).json({ message: "Unauthorized" })
  }
}

