import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth/auth.routes';
import passwordResetRoutes from './routes/auth/password-reset.routes';
import feedRoutes from './routes/feed/feed.routes';
import truthsRoutes from './routes/truths/truths.routes';
import daresRoutes from './routes/dares/dares.routes';
import usersRoutes from './routes/users/users.routes';
import uploadsRoutes from './routes/uploads/uploads.routes';
import truthLikesRoutes from './routes/truths/likes.routes';
import truthCommentsLikesRoutes from './routes/truths/comments-likes.routes';
import dareLikesRoutes from './routes/dares/likes.routes';
import clubLikesRoutes from './routes/clubs/likes.routes';
import clubFeedRoutes from './routes/clubs/feed.routes';
import clubPromptsRoutes from './routes/clubs/prompts.routes';
import clubsRoutes from './routes/clubs/clubs.routes';
import notificationsRoutes from './routes/notifications.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/auth', passwordResetRoutes);
app.use('/feed', feedRoutes);
app.use('/truths', truthsRoutes);
app.use('/dares', daresRoutes);
app.use('/users', usersRoutes);
app.use('/uploads', uploadsRoutes);
app.use('/clubs', clubFeedRoutes);
app.use('/clubs', clubPromptsRoutes);
app.use('/clubs', clubsRoutes);
app.use('/notifications', notificationsRoutes);
app.use(truthLikesRoutes);
app.use(truthCommentsLikesRoutes);
app.use(dareLikesRoutes);
app.use(clubLikesRoutes);

export default app;
