import mongoose, { Document, Schema } from 'mongoose';

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  description?: string;
  documents: mongoose.Types.ObjectId[];
  chats: mongoose.Types.ObjectId[];
  progress: {
    completedTopics: string[];
    currentTopic?: string;
    studyGoals: Array<{
      goal: string;
      completed: boolean;
      dueDate?: Date;
    }>;
    timeSpent: number; // in minutes
  };
  settings: {
    difficulty: 'easy' | 'medium' | 'hard';
    studyMode: 'reading' | 'practice' | 'review';
    reminderEnabled: boolean;
    reminderTime?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studySessionSchema = new Schema<IStudySession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  documents: [{
    type: Schema.Types.ObjectId,
    ref: 'Document'
  }],
  chats: [{
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  }],
  progress: {
    completedTopics: [{ type: String }],
    currentTopic: { type: String },
    studyGoals: [{
      goal: { type: String, required: true },
      completed: { type: Boolean, default: false },
      dueDate: { type: Date }
    }],
    timeSpent: { type: Number, default: 0 }
  },
  settings: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    studyMode: {
      type: String,
      enum: ['reading', 'practice', 'review'],
      default: 'reading'
    },
    reminderEnabled: { type: Boolean, default: false },
    reminderTime: { type: Date }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IStudySession>('StudySession', studySessionSchema);