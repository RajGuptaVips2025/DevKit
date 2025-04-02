import mongoose, { Schema, Document } from 'mongoose';

interface IDocument extends Document {
  title: string;
  content: string;
}

const DocumentSchema = new Schema<IDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
});

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
