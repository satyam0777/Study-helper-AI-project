import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface IDocument extends MongoDocument {
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  extractedText?: string;
  summary?: string;
  keyPoints?: string[];
  tags: string[];
  uploadDate: Date;
  lastProcessed?: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: {
    pageCount?: number;
    language?: string;
    confidence?: number;
  };
}

const documentSchema = new Schema<IDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  extractedText: { type: String },
  summary: { type: String },
  keyPoints: [{ type: String }],
  tags: [{ type: String }],
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastProcessed: { type: Date },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: {
    pageCount: { type: Number },
    language: { type: String },
    confidence: { type: Number }
  }
}, {
  timestamps: true
});

export default mongoose.model<IDocument>('Document', documentSchema);