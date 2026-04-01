import express from "express"
import { createConversation, getConversations, getMessages } from "../controllers/conversationController"
import { checkFriendship } from "../middlewares/friendMiddleware"

const router = express.Router()

router.post("/", checkFriendship, createConversation)
router.get("/", getConversations)
router.get("/:conversationId/messages", getMessages)

export default router
