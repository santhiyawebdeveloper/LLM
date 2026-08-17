import { Schema, model, Document, Types } from 'mongoose';

export interface IStore extends Document {
  _id: Types.ObjectId;
  shopDomain: string;
  shopName: string;
  shopifyAccessToken: string;
  scopes: string;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    shopDomain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    shopifyAccessToken: {
      type: String,
      required: true,
      select: false,
    },
    scopes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const { shopifyAccessToken: _token, ...safeStore } = ret as IStore & {
          shopifyAccessToken?: string;
        };
        return safeStore;
      },
    },
    toObject: {
      transform(_doc, ret) {
        const { shopifyAccessToken: _token, ...safeStore } = ret as IStore & {
          shopifyAccessToken?: string;
        };
        return safeStore;
      },
    },
  }
);

storeSchema.index({ shopDomain: 1 }, { unique: true });

export const Store = model<IStore>('Store', storeSchema);
