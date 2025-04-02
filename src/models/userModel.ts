import mongoose, { Schema, Document, Model } from "mongoose";

// Define an interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  projects: mongoose.Types.ObjectId[]; // Array of project IDs
  groups: mongoose.Types.ObjectId[]; // Array of group IDs
  profilePic: string;
  profileUrl: string; // New field from the first schema
  avatarUrl?: string; // Optional avatar URL from the first schema
  likedProfiles: string[]; // New field from the first schema
  likedBy: {
    username: string;
    avatarUrl?: string;
    likedDate: Date;
  }[]; // New field from the first schema
}

// Define the User schema
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }], // Reference to Project model
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }], // Reference to Group model
    profilePic: { type: String },
    profileUrl: { type: String, required: true }, // New field from the first schema
    avatarUrl: { type: String }, // Optional avatar URL from the first schema
    likedProfiles: { type: [String], default: [] }, // New field from the first schema
    likedBy: [
      {
        username: { type: String, required: true },
        avatarUrl: { type: String },
        likedDate: { type: Date, default: Date.now },
      },
    ], // New field from the first schema
  },
  { timestamps: true }
);

// Check if the model already exists to avoid overwriting it
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
