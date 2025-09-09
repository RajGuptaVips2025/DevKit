import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;  
  name: string;
  email: string;
  lastPromptTime?: Date; 
  lastCooldownTime?: Date;   
  dailyPromptCount?: number;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    lastPromptTime: {
      type: Date,
      default: null,
    },
    lastCooldownTime: {
      type: Date,
      default: null,
    },
    dailyPromptCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
