// import mongoose from "mongoose";

// const projectSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, unique: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// // Check if the model already exists to avoid overwriting it
// const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

// export default Project;






// import mongoose, { Schema, Document, Model } from "mongoose";

// // Define an interface for the Project document
// interface IProject extends Document {
//   admin: string; // Reference to the admin's user ID
//   members: string[]; // Array of user IDs (max 5 members)
//   isPrivate: boolean; // Whether the project is private
//   projectName: string; // Name of the project
//   coverPageImg: string; // URL or path to the cover page image
// }

// // Create the Project schema
// const projectSchema: Schema<IProject> = new mongoose.Schema(
//   {
//     admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     members: {
//       type: [{ type: Schema.Types.ObjectId, ref: "User" }],
//       validate: {
//         validator: function (members: string[]) {
//           return members.length <= 5; // Ensure a maximum of 5 members
//         },
//         message: "A project can have a maximum of 5 members.",
//       },
//     },
//     isPrivate: { type: Boolean, default: false },
//     projectName: { type: String, required: true, trim: true },
//     coverPageImg: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// // Check if the model already exists to avoid overwriting it
// const Project: Model<IProject> =
//   mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

// export default Project;






// import mongoose, { Schema, Document, Model } from "mongoose";

// // Define an interface for the Project document
// export interface IProject extends Document {
//   projectName: string;
//   admin: mongoose.Types.ObjectId;
//   members: mongoose.Types.ObjectId[];
//   isPrivate: boolean;
//   coverPageImg: string;
// }

// // Define the Project schema
// const projectSchema = new Schema<IProject>(
//   {
//     projectName: { type: String, required: true, trim: true },
//     admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     members: {
//       type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//       validate: [membersLimit, "A project can have a maximum of 5 members."],
//     },
//     isPrivate: { type: Boolean, default: false },
//     coverPageImg: { type: String },
//   },
//   { timestamps: true }
// );

// // Custom validator to ensure the members array doesn't exceed 5
// function membersLimit(val: mongoose.Types.ObjectId[]): boolean {
//   return val.length <= 5;
// }

// // Check if the model already exists to avoid overwriting it
// const Project: Model<IProject> =
//   mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

// export default Project;














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
