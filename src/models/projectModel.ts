import mongoose, { Schema, Document, Model } from "mongoose";

// Define an interface for the Project document
export interface IProject extends Document {
  projectName: string;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  isPrivate: boolean;
  coverPageImg: string;
}

// Define the Project schema
const projectSchema = new Schema<IProject>(
  {
    projectName: { type: String, required: true, trim: true },
    admins: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: [adminsLimit, "A project can have a maximum of 5 admins."],
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPrivate: { type: Boolean, default: false },
    coverPageImg: { type: String },
  },
  { timestamps: true }
);

// Custom validator to ensure the admins array doesn't exceed 5
function adminsLimit(val: mongoose.Types.ObjectId[]): boolean {
  return val.length <= 5;
}

// Check if the model already exists to avoid overwriting it
const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

export default Project;
