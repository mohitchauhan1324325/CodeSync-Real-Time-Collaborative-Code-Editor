import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User, Room, RoomVersion, ExecutionHistory } from '../models/index.js';

dotenv.config();

const runModelVerification = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected.');

    // 1. Test User creation & password hashing
    const testEmail = `test_${Date.now()}@example.com`;
    const user = new User({
      name: 'Verification User',
      email: testEmail,
      passwordHash: 'SuperSecret123!',
    });

    await user.save();
    console.log(`✓ User model verified. Created user ID: ${user._id}`);
    
    const isMatch = await user.comparePassword('SuperSecret123!');
    console.log(`✓ Password comparison verified: ${isMatch}`);

    const userJson = user.toJSON();
    console.log(`✓ Safe JSON serialization verified: passwordHash excluded = ${userJson.passwordHash === undefined}`);

    // 2. Test Room creation
    const room = new Room({
      roomId: `CS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      name: 'Test Algorithm Room',
      owner: user._id,
      language: 'javascript',
    });
    await room.save();
    console.log(`✓ Room model verified. Created roomId: ${room.roomId}`);

    // 3. Test RoomVersion creation
    const version = new RoomVersion({
      roomId: room.roomId,
      code: 'console.log("Hello from snapshot");',
      language: 'javascript',
      title: 'Initial Commit',
      savedBy: user._id,
    });
    await version.save();
    console.log(`✓ RoomVersion model verified. Version ID: ${version._id}`);

    // 4. Test ExecutionHistory creation
    const execution = new ExecutionHistory({
      roomId: room.roomId,
      userId: user._id,
      language: 'javascript',
      stdout: 'Hello from snapshot\n',
      status: 'Accepted',
      executionTime: 42,
      memoryUsage: 12040,
    });
    await execution.save();
    console.log(`✓ ExecutionHistory model verified. ID: ${execution._id}`);

    // Clean up test documents
    await ExecutionHistory.deleteOne({ _id: execution._id });
    await RoomVersion.deleteOne({ _id: version._id });
    await Room.deleteOne({ _id: room._id });
    await User.deleteOne({ _id: user._id });
    console.log('✓ Cleaned up test documents successfully.');

    await mongoose.disconnect();
    console.log('✓ All database models verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Model verification error:', error);
    process.exit(1);
  }
};

runModelVerification();
