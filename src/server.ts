import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoute';
import userRoutes from './routes/userRoute';
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
app.use('/api/auth', authRoutes);

// private routes
app.use(protectedRoute)
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});
