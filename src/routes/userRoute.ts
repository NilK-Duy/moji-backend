import express from "express";
import { authMe } from "../controllers/userController";

const router = express.Router();

router.get("/me", authMe);

export default router;
