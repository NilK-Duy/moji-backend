import { Request, Response } from "express";

export const authMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user
    res.status(200).json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ message: "Server error" })
  }
}
