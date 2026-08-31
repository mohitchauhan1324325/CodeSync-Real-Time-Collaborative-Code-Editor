import mongoose from 'mongoose';

const executionHistorySchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
    },
    stdin: {
      type: String,
      default: '',
    },
    stdout: {
      type: String,
      default: '',
    },
    stderr: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Executed',
    },
    executionTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    memoryUsage: {
      type: Number, // in KB
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

executionHistorySchema.index({ roomId: 1, createdAt: -1 });
executionHistorySchema.index({ userId: 1, createdAt: -1 });

const ExecutionHistory = mongoose.model('ExecutionHistory', executionHistorySchema);

export default ExecutionHistory;
