// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, unique: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true },
//     profilePic: { type: String },
//   },
//   { timestamps: true }
// );

// // Check if the model already exists to avoid overwriting it
// const User = mongoose.models.User || mongoose.model("User", userSchema);

// export default User;


import mongoose, { Schema, Document, Model } from "mongoose";

// Define an interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  projects: mongoose.Types.ObjectId[]; // Array of project IDs
  groups: mongoose.Types.ObjectId[]; // Array of group IDs
  profilePic : string
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
  },
  { timestamps: true }
);

// Check if the model already exists to avoid overwriting it
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
