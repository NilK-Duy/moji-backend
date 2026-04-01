import express from 'express';
import authRoute from './routes/authRoute';
import userRoute from './routes/userRoute';
import friendRoute from './routes/friendRoute'
import messageRoute from './routes/messageRoute'
import conversationRoute from './routes/conversationRoute'
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware';
import cors from 'cors';
import swaggerUi from "swagger-ui-express";
import fs from "fs";

const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));

// swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// public routes
app.use('/api/auth', authRoute);

// private routes
app.use(protectedRoute)
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute)
app.use('/api/messages', messageRoute)
app.use('/api/conversations', conversationRoute)

export default app
