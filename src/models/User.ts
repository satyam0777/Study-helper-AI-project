import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    studyGoals?: string[];
    preferences: {
      aiPersonality: 'friendly' | 'professional' | 'casual';
      difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
      studyReminders: boolean;
    };
  };
  subscription: {
    plan: 'free' | 'premium';
    expiresAt?: Date;
    usage: {
      aiQueries: number;
      pdfUploads: number;
      imagesGenerated: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    avatar: { type: String },
    studyGoals: [{ type: String }],
    preferences: {
      aiPersonality: {
        type: String,
        enum: ['friendly', 'professional', 'casual'],
        default: 'friendly'
      },
      difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
      },
      studyReminders: { type: Boolean, default: true }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    expiresAt: { type: Date },
    usage: {
      aiQueries: { type: Number, default: 0 },
      pdfUploads: { type: Number, default: 0 },
      imagesGenerated: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// };
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);