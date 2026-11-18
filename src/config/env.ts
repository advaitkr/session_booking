import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: required('MONGO_URI'),
};