import { Types } from 'mongoose';
import { User } from '../models/User';
import { Session, SessionStatus } from '../models/Session';
import { Teacher } from '../models/Teacher';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { assertObjectId } from '../utils/validators';

export const createUser = asyncHandler(async (req, res) => {
    console.log(req.headers['content-type'], req.body);   // ← inside the function
  
    const { fullName, email, phone } = req.body ?? {};
    if (!fullName || !email || !phone) {
      throw new AppError('fullName, email and phone are required', 400);
    }
    const user = await User.create({ fullName, email, phone });
    res.status(201).json({ success: true, data: user });
});
export const getUserSessions = asyncHandler(async (req, res) => {
    const id = assertObjectId(req.params.id, 'user id');
  
    if (!(await User.exists({ _id: id }))) throw new AppError('User not found', 404);
  
    const [result] = await Session.aggregate([
      // Aggregation does NOT auto-cast strings to ObjectId, so cast manually
      { $match: { userId: new Types.ObjectId(id), status: { $in: [SessionStatus.BOOKED, SessionStatus.COMPLETED] } } },
      {
        $lookup: {
          from: Teacher.collection.name,
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: '$teacher' },
      {
        $project: {
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          teacher: { _id: 1, fullName: 1, specialization: 1 },
        },
      },
      {
        $facet: {
          upcomingSessions: [
            { $match: { status: SessionStatus.BOOKED } },
            { $sort: { startTime: 1 } },
          ],
          completedSessions: [
            { $match: { status: SessionStatus.COMPLETED } },
            { $sort: { completedAt: -1 } },
          ],
        },
      },
    ]);
  
    res.status(200).json({ success: true, data: result });
  });