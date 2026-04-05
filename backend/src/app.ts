import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import feedRoutes from './routes/feed.routes';
import truthsRoutes from './routes/truths.routes';
import daresRoutes from './routes/dares.routes';
import usersRoutes from './routes/users.routes';
import truthLikesRoutes from './routes/truth-likes.routes';
import dareLikesRoutes from './routes/dare-likes.routes';
import clubLikesRoutes from './routes/club-likes.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);
app.use('/truths', truthsRoutes);
app.use('/dares', daresRoutes);
app.use('/users', usersRoutes);
app.use(truthLikesRoutes);
app.use(dareLikesRoutes);
app.use(clubLikesRoutes);

export default app;