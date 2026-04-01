import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import feedRoutes from './routes/feed.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);

export default app;