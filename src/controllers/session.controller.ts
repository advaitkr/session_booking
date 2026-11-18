import { Session, SessionStatus } from '../models/Session';
import { Teacher } from '../models/Teacher';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { assertObjectId } from '../utils/validators';

// API 2: Create Session
export const createSession = asyncHandler(async (req, res) => {
  const teacherId = assertObjectId(req.body.teacherId, 'teacherId');
  const startTime = new Date(req.body.startTime);
  const endTime = new Date(req.body.endTime);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new AppError('startTime and endTime must be valid dates', 400);
  }
  if (endTime <= startTime) {
    throw new AppError('endTime must be greater than startTime', 400);
  }
  if (!(await Teacher.exists({ _id: teacherId }))) {
    throw new AppError('Teacher not found', 404);
  }

  const session = await Session.create({ teacherId, startTime, endTime }); // status defaults to AVAILABLE
  res.status(201).json({ success: true, data: session });
});

// API 3: Available sessions for a date (aggregation)
export const getAvailableSessions = asyncHandler(async (req, res) => {
  const ts = Number(req.query.dateTimestamp); // epoch milliseconds
  if (!Number.isFinite(ts)) throw new AppError('dateTimestamp (epoch ms) is required', 400);

  // Day window [00:00 UTC, next 00:00 UTC)
  const d = new Date(ts);
  const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const sessions = await Session.aggregate([
    { $match: { status: SessionStatus.AVAILABLE, startTime: { $gte: dayStart, $lt: dayEnd } } },
    { $sort: { startTime: 1 } },
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
        teacher: { _id: 1, fullName: 1, specialization: 1, experience: 1 },
      },
    },
  ]);

  res.status(200).json({ success: true, count: sessions.length, data: sessions });
});

// API 4: Book Session
export const bookSession = asyncHandler(async (req, res) => {
  const sessionId = assertObjectId(req.params.id, 'session id');
  const userId = assertObjectId(req.body.userId, 'userId');

  if (!(await User.exists({ _id: userId }))) throw new AppError('User not found', 404);

  // Atomic: the status check lives INSIDE the update filter, so only one request can win.
  const booked = await Session.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.AVAILABLE },
    { $set: { status: SessionStatus.BOOKED, userId } },
    { new: true }
  );

  if (!booked) {
    // Update matched nothing: either the session doesn't exist, or it's not AVAILABLE
    if (!(await Session.exists({ _id: sessionId }))) throw new AppError('Session not found', 404);
    throw new AppError('Session is not available for booking', 409);
  }

  res.status(200).json({ success: true, data: booked });
});

// API 5: Mark Complete
export const completeSession = asyncHandler(async (req, res) => {
  const sessionId = assertObjectId(req.params.id, 'session id');

  const completed = await Session.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.BOOKED },
    { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
    { new: true }
  );

  if (!completed) {
    if (!(await Session.exists({ _id: sessionId }))) throw new AppError('Session not found', 404);
    throw new AppError('Only BOOKED sessions can be marked as completed', 409);
  }

  res.status(200).json({ success: true, data: completed });
});