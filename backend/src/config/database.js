import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://zaydensamuel269_db_user:zK9RBaM88qJ7c1qG@cluster0.vswhzjs.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

export default mongoose;
