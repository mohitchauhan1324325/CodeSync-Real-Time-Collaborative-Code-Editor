import mongoose from 'mongoose';
import { SUPPORTED_LANGUAGES } from '../config/constants.js';

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a room name'],
      trim: true,
      maxlength: [80, 'Room name cannot exceed 80 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: Object.keys(SUPPORTED_LANGUAGES),
      default: 'javascript',
    },
    code: {
      type: String,
      default: function () {
        return SUPPORTED_LANGUAGES[this.language]?.defaultCode || '// Happy Coding!';
      },
    },
    participants: [participantSchema],
    isPublic: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user query performance
roomSchema.index({ owner: 1, createdAt: -1 });
roomSchema.index({ 'participants.user': 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
