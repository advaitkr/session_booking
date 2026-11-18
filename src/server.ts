import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

const start = async () => {
  await connectDB();
  app.listen(env.port, () => console.log(`Server running on port ${env.port}`));
};

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});