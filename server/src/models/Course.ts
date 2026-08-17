import { Schema, model, Document, Types } from 'mongoose';

export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  title: string;
  description: string;
  instructorName: string;
  category: string;
  duration: number;
  status: CourseStatus;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    instructorName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: [1, 'Duration must be positive'],
    },
    status: {
      type: String,
      enum: Object.values(CourseStatus),
      default: CourseStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

courseSchema.index({ storeId: 1, status: 1 });
courseSchema.index({ storeId: 1, title: 'text' });

export const Course = model<ICourse>('Course', courseSchema);
