import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import feedRoutes from './routes/feed.routes';
import truthsRoutes from './routes/truths.routes';
import daresRoutes from './routes/dares.routes';
import usersRoutes from './routes/users.routes';
import uploadsRoutes from './routes/uploads.routes';
import truthLikesRoutes from './routes/truth-likes.routes';
import truthCommentsLikesRoutes from './routes/truth-comments-likes.routes';
import dareLikesRoutes from './routes/dare-likes.routes';
import clubLikesRoutes from './routes/club-likes.routes';
import clubFeedRoutes from './routes/club-feed.routes';
import clubPromptsRoutes from './routes/club-prompts.routes';
import clubsRoutes from './routes/clubs.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);
app.use('/truths', truthsRoutes);
app.use('/dares', daresRoutes);
app.use('/users', usersRoutes);
app.use('/uploads', uploadsRoutes);
app.use('/clubs', clubFeedRoutes);
app.use('/clubs', clubPromptsRoutes);
app.use('/clubs', clubsRoutes);
app.use(truthLikesRoutes);
app.use(truthCommentsLikesRoutes);
app.use(dareLikesRoutes);
app.use(clubLikesRoutes);

export default app;
