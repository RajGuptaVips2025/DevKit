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
  content?: string; // only for type: "file"
  children?: FileNode[]; // only for type: "folder"
}

export interface IGeneration extends Document {
  user: Types.ObjectId;
  prompt: string;
  modelName: string;
  output: string;
  steps?: Step[];
  files?: FileNode[];
  createdAt: Date;
}

const FileNodeSchema: Schema<FileNode> = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "folder"], required: true },
    path: { type: String, required: true },
    content: { type: String }, // optional, for files
    children: [/* recursive reference, added below */],
  },
  { _id: false }
);

// Recursive reference for nested folders
FileNodeSchema.add({
  children: [FileNodeSchema],
});

const GenerationSchema = new Schema<IGeneration>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    prompt: { type: String, required: true },
    modelName: { type: String, required: true },
    output: { type: String, required: true },
    steps: [
      {
        code: { type: String },
        id: { type: Number, required: true },
        description: { type: String, default: '' },
        path: { type: String, default: '' },
        status: { type: String, required: true },
        title: { type: String, required: true },
        type: { type: Number, required: true },
      }
    ],
    files: [FileNodeSchema],
  },
  { timestamps: true }
);

const Generation: Model<IGeneration> =
  mongoose.models.Generation || mongoose.model<IGeneration>("Generation", GenerationSchema);

export default Generation;