import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import feedRoutes from './routes/feed.routes';
import truthsRoutes from './routes/truths.routes';
import daresRoutes from './routes/dares.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);
app.use('/truths', truthsRoutes);
app.use('/dares', daresRoutes);

export default app;