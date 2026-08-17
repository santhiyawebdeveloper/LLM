import { Schema, model, Document, Types } from 'mongoose';

export enum EnrollmentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(EnrollmentStatus),
      default: EnrollmentStatus.IN_PROGRESS,
    },
  },
  { timestamps: true }
);

enrollmentSchema.index(
  { storeId: 1, studentId: 1, courseId: 1 },
  { unique: true }
);
enrollmentSchema.index({ storeId: 1, status: 1 });
enrollmentSchema.index({ storeId: 1, enrollmentDate: -1 });
enrollmentSchema.index({ storeId: 1, courseId: 1 });

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
