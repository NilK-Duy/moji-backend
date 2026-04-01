import { Request, Response } from "express"
import Conversation from "../models/Conversation"
import Message from "../models/Message"
import { updateConversationAfterCreateMessage } from "../utils/messageHelper"

export const sendDirectMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId, content, conversationId } = req.body
    const senderId = req.user._id

    let conversation

    if (!content) {
      res.status(400).json({message: "Missing content"})
      return
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId)
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          {userId: senderId, joinedAt: new Date()},
          {userId: recipientId, joinedAt: new Date()}
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map()
      })
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    })

    updateConversationAfterCreateMessage(conversation, message, senderId)

    await conversation.save()

    res.status(201).json({message})
    return

  } catch (error) {
    console.error("Error when send direct message", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
}

export const sendGroupMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const {conversationId, content} = req.body
    const senderId = req.user._id
    const conversation = req.conversation

    if (!content) {
      res.status(400).json({message: "Missing content"})
      return
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content
    })

    updateConversationAfterCreateMessage(conversation, message, senderId)

    await conversation.save()

    res.status(201).json({message})

  } catch (error) {
    console.error("Error when send group message", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
}
