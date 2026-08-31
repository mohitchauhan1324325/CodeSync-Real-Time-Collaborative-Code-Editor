import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const TEST_MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codesync';

export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
};

export const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};
