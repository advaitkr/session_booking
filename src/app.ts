import express from 'express';
import userRoutes from './routes/user.routes';
import sessionRoutes from './routes/session.routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app = express();
app.use(express.json());

app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);

app.use(notFound);
app.use(errorHandler); // must be last

export default app;