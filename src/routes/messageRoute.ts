import express from 'express';

import { sendDirectMessage, sendGroupMessage } from '../controllers/messageController';
import { checkFriendship, checkGroupMembership } from '../middlewares/friendMiddleware';

const router = express.Router()

router.post("/direct", checkFriendship, sendDirectMessage)
router.post("/group", checkGroupMembership, sendGroupMessage)

export default router
