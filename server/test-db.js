import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing connection to MongoDB Atlas...');
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log('✅ Successfully connected to MongoDB Atlas!');
  await mongoose.disconnect();
  console.log('Disconnected cleanly.');
  process.exit(0);
} catch (error) {
  console.error('❌ MongoDB Connection Error:', error.message);
  process.exit(1);
}
