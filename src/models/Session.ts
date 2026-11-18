import { Schema, model, Types } from 'mongoose';

export enum SessionStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  COMPLETED = 'COMPLETED',
}

export interface ISession {
  teacherId: Types.ObjectId;
  userId: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  completedAt: Date | null;
}

const sessionSchema = new Schema<ISession>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.AVAILABLE },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Supports API 3 (status + date range) and API 6 (user lookup)
sessionSchema.index({ status: 1, startTime: 1 });
sessionSchema.index({ userId: 1, status: 1 });

export const Session = model<ISession>('Session', sessionSchema);