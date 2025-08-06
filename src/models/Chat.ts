import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId?: string;
  type: 'question' | 'summary' | 'quiz' | 'image' | 'flashcard';
  input: {
    text?: string;
    imagePrompt?: string;
    pdfContent?: string;
  };
  output: {
    text?: string;
    imageUrl?: string;
    quiz?: {
      questions: Array<{
        question: string;
        options?: string[];
        correctAnswer: string;
        explanation?: string;
      }>;
    };
    flashcards?: Array<{
      front: string;
      back: string;
    }>;
  };
  metadata: {
    model?: string;
    tokensUsed?: number;
    responseTime?: number;
    confidence?: number;
  };
  tags: string[];
  isBookmarked: boolean;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: { type: String },
  type: {
    type: String,
    enum: ['question', 'summary', 'quiz', 'image', 'flashcard'],
    required: true
  },
  input: {
    text: { type: String },
    imagePrompt: { type: String },
    pdfContent: { type: String }
  },
  output: {
    text: { type: String },
    imageUrl: { type: String },
    quiz: {
      questions: [{
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        explanation: { type: String }
      }]
    },
    flashcards: [{
      front: { type: String, required: true },
      back: { type: String, required: true }
    }]
  },
  metadata: {
    model: { type: String },
    tokensUsed: { type: Number },
    responseTime: { type: Number },
    confidence: { type: Number, min: 0, max: 1 }
  },
  tags: [{ type: String }],
  isBookmarked: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for better query performance
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, type: 1 });
chatSchema.index({ tags: 1 });

export default mongoose.model<IChat>('Chat', chatSchema);