import mongoose from 'mongoose';

const roomVersionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Version title cannot exceed 100 characters'],
      default: function () {
        return `Snapshot - ${new Date().toLocaleString()}`;
      },
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for querying versions of a room in reverse chronological order
roomVersionSchema.index({ roomId: 1, createdAt: -1 });

const RoomVersion = mongoose.model('RoomVersion', roomVersionSchema);

export default RoomVersion;
