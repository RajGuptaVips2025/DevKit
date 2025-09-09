import mongoose, { Schema, Document, Types, Model } from "mongoose";

interface Step {
  code?: string;
  id: number;
  description?: string;
  path?: string;
  status: string;
  title: string;
  type: number;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  content?: string; 
  children?: FileNode[]; 
}

export interface IGeneration extends Document {
  user: Types.ObjectId;
  imageUrl?: string;
  prompt: string;
  modelName: string;
  framework: "react" | "angular"; 
  output: string;
  steps?: Step[];
  files?: FileNode[];
  source?: "ui" | "api" | "regeneration";
  createdAt: Date;
}

const FileNodeSchema: Schema<FileNode> = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "folder"], required: true },
    path: { type: String, required: true },
    content: { type: String },
    children: [],
  },
  { _id: false }
);

FileNodeSchema.add({
  children: [FileNodeSchema],
});

const GenerationSchema = new Schema<IGeneration>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, default: null },
    prompt: { type: String, required: true },
    modelName: { type: String, required: true },
    framework: { type: String, enum: ["react", "angular"], required: true },
    output: { type: String, required: true },
    steps: [
      {
        code: { type: String },
        id: { type: Number, required: true },
        description: { type: String, default: "" },
        path: { type: String, default: "" },
        status: { type: String, required: true },
        title: { type: String, required: true },
        type: { type: Number, required: true },
      },
    ],
    files: [FileNodeSchema],
    source: {
      type: String,
      enum: ["ui", "api", "regeneration"],
      default: "ui",
    },
  },
  { timestamps: true }
);

const Generation: Model<IGeneration> =
  mongoose.models.Generation || mongoose.model<IGeneration>("Generation", GenerationSchema);

export default Generation;