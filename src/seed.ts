import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Teacher } from './models/Teacher';

(async () => {
  await connectDB();
  const teacher = await Teacher.create({
    fullName: 'Ananya Sharma',
    email: 'ananya@example.com',
    specialization: 'Mathematics',
    experience: 8,
  });
  console.log('Teacher created. teacherId =', teacher._id.toString());
  await mongoose.disconnect();
})();