import { Schema, model, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

studentSchema.index({ storeId: 1, email: 1 }, { unique: true });
studentSchema.index({ storeId: 1, name: 1 });

export const Student = model<IStudent>('Student', studentSchema);
