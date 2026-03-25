import { Request, Response } from "express";
import Friend from "../models/Friend";
import User from "../models/User";
import FriendRequest from "../models/FriendRequest";

export const sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, message } = req.body

    const from = req.user._id

    if (from === to) {
      res.status(400).json({message: "Can not send friend request to yourself"})
      return
    }

    const userExists = await User.exists({ _id: to })

    if (!userExists) {
      res.status(404).json({message: "User is not exist"})
      return
    }

    let userA = from.toString()
    let userB = to.toString()

    if (userA > userB) {
      [userA, userB] = [userB, userA]
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({userA, userB}),
      FriendRequest.findOne({
        $or: [
          {from, to},
          {from: to, to: from}
        ]
      })
    ])

    if (alreadyFriends) {
      res.status(400).json({message: "Two users have already been friends"})
      return
    }

    if (existingRequest) {
      res.status(400).json({message: "Already has a pending friend request"})
      return
    }

    const request = await FriendRequest.create({
      from,
      to,
      message
    })

    res.status(202).json({message: "Send friend request successfully", request})
    return

  } catch (error) {
    console.error("Error when send friend request", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
}

export const acceptFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params
    const userId = req.user._id

    const request = await FriendRequest.findById(requestId)

    if (!request) {
      res.status(404).json({message: "Can not find friend request"})
      return
    }

    if (request.to.toString() !== userId.toString()) {
      res.status(403).json({message: "You do not have the right to accept this friend request"})
      return
    }

    const friend = await Friend.create({
      userA: request.from,
      userB: request.to
    })

    await FriendRequest.findByIdAndDelete(requestId)

    const from = await User.findById(request.from).select(
      "_id displayName avatarUrl"
    ).lean()

    res.status(200).json({
      message: "Accecpt friend request successfully",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl
      }
    })
    return

  } catch (error) {
    console.error("Error when accept friend request", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
}

export const declineFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params
    const userId = req.user._id

    const request = await FriendRequest.findById(requestId)

    if (!request) {
      res.status(404).json({message: "Do not find friend request"})
      return
    }

    if (request.to.toString() !== userId.toString()) {
      res.status(403).json({message: "You do not have the right to decline this friend request"})
    }

    await FriendRequest.findByIdAndDelete(requestId)
    res.sendStatus(204)
    return

  } catch (error) {
    console.error("Error when decline friend request", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
}

export const getAllFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id

    const friendships = await Friend.find({
      $or: [
        {
          userA: userId
        },
        {
          userB: userId
        }
      ]
    })
      .populate("userA", "_id displayName avatarUrl")
      .populate("userB", "_id displayName avatarUrl")
      .lean()
    
    if (!friendships.length) {
      res.status(200).json({ friends: [] })
      return
    }

    const friends = friendships.map((f) =>
      f.userA._id.toString() === userId.toString() ? f.userB : f.userA
    )

    res.status(200).json({ friends })
    return

  } catch (error) {
    console.error("Error when get list friend", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
}

export const getFriendRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id

    const populateFields = "_id username displayName avatarUrl"

    const [sent, received] = await Promise.all([
      FriendRequest.find({from: userId}).populate("to", populateFields),
      FriendRequest.find({to: userId}).populate("from", populateFields)
    ])

    res.status(200).json({sent, received})
  } catch (error) {
    console.error("Error when get list friend request", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
}
