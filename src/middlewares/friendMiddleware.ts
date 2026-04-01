import { NextFunction, Request, Response } from "express";
import Conversation from "../models/Conversation";
import Friend from "../models/Friend";

const pair = (a: string, b: string) => (a < b ? [a, b] : [b, a])

export const checkFriendship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const me = req.user._id.toString()
    const recipientId = req.body?.recipientId ?? null
    const memberIds = req.body?.memberIds ?? []

    if (!recipientId && memberIds.length === 0) {
      res.status(400).json({message: "Need to provide recipientId or memberIds"})
      return
    }

    if (recipientId) {
      const [userA, userB] = pair(me, recipientId)

      const isFriend = await Friend.findOne({ userA, userB })

      if (!isFriend) {
        res.status(403).json({message: "You are not friends with this person yet"})
        return
      }

      return next()
    }

    const friendChecks = memberIds.map(async (memberId: string) => {
      const [userA, userB] = pair(me, memberId)
      const friend = await Friend.findOne({ userA, userB })
      return friend ? null : memberId
    })

    const results = await Promise.all(friendChecks)
    const notFriends = results.filter(Boolean)

    if (notFriends.length > 0) {
      res.status(403).json({ message: "You can only add friends to the group."})
      return
    }

    next()
  } catch (error) {
    console.error("An error occurred when checkeFriendship:", error)
    res.status(500).json({message: "Internal server error."})
    return
  }
}

export const checkGroupMembership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {conversationId} = req.body
    const userId = req.user._id

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      res.status(404).json({message: "No conversation found"})
      return
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    )

    if (!isMember) {
      res.status(403).json({message: "You are not in this group"})
    }

    req.conversation = conversation

    next()
  } catch (error) {
    console.error("An error occurred when checkGroupMembership:", error)
    res.status(500).json({message: "Internal server error."})
    return

  }
}
