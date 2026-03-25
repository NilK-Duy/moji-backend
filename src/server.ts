import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoute from './routes/authRoute';
import userRoute from './routes/userRoute';
import friendRoute from './routes/friendRoute'
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware';
import cors from 'cors';

dotenv.config();
connectDB()

const app = express();
const PORT = process.env.PORT || 8000;

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CLIENT_URL, credentials: true}));

// public routes
app.use('/api/auth', authRoute);

// private routes
app.use(protectedRoute)
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});
