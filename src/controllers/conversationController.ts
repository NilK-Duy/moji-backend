import { Request, Response } from "express"
import Conversation from "../models/Conversation"
import Message from "../models/Message"
import mongoose from "mongoose"

export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const {type, name, memberIds} = req.body
    const userId = req.user._id

    if (
      !type || 
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      res.status(400).json({message: "Group name and member list are required"})
      return
    }

    let conversation

    if (type === 'direct') {
      const participantId = memberIds[0]

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": {$all: [userId, participantId]}
      })

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date()
        })

        await conversation.save()
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [
          {userId},
          ...memberIds.map((id) => ({userId: id}))
        ],
        group: {
          name,
          createdBy: userId
        },
        lastMessageAt: new Date()
      })

      await conversation.save()
    }

    if (!conversation) {
      res.status(400).json({message: "Conversation type is not appropriate"})
      return
    }

    await conversation.populate([
      {
        path: "participants.userId",
        select: "displayName avatarUrl"
      },
      {
        path: "seenBy",
        select: "displayName avatarUrl"
      },
      {
        path: "lastMessage.senderId",
        select: "displayName avatarUrl"
      }
    ])

    res.status(201).json({conversation})

  } catch (error) {
    console.error("Error while creating conversation: ", error)
    res.status(500).json({message: "Internal server error."})
    return
  }
}

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id
    const conversations = await Conversation.find({
      "participants.userId": userId
    })
      .sort({lastMessageAt: -1, updatedAt: -1})
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl"
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl"
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl"
      })

      const formatted = conversations.map((convo) => {
        const participants = (convo.participants || []).map((p) => {
          const user = p.userId as any
          return {
            _id: user._id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl ?? null,
            joinedAt: p.joinedAt
          }
        })

        return {
          ...convo.toObject(),
          unreadCounts: convo.unreadCounts || {},
          participants,
        }
      })

      res.status(200).json({conversation: formatted})
      return
  } catch (error) {
    console.error("Error while getting conversation: ", error)
    res.status(500).json({message: "Internal server error."})
    return
  }
}

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.conversationId as string
    const {limit = 50, cursor} = req.query

    const query: any = { 
      conversationId: new mongoose.Types.ObjectId(conversationId)
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor as string) }
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1)

    let nextCursor: string | null = null

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1]
      nextCursor = nextMessage.createdAt.toISOString()
      messages.pop()
    }

    messages = messages.reverse()

    res.status(200).json({ messages, nextCursor })
  } catch (error) {
    console.error("Error while getting messages:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}
