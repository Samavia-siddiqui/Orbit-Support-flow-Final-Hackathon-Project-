import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import CategoryAvailability from '../models/CategoryAvailability.js';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    // Set custom DNS servers to ensure Atlas SRV resolution works in local environments
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('Warning: Could not set DNS servers:', dnsErr.message);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default agent user if not already present
    const agentEmail = (process.env.AGENT_EMAIL || 'agent@orbit.com').toLowerCase();
    const agentExists = await User.findOne({ email: agentEmail });
    if (!agentExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('agent123', salt);
      await User.create({
        name: 'Agent Orbit',
        email: agentEmail,
        password: hashedPassword,
        role: 'agent',
      });
      console.log('Seeded Agent Orbit user successfully.');
    }

    // Seed default category availability settings if not already present
    const availability = await CategoryAvailability.findOne();
    if (!availability) {
      await CategoryAvailability.create({});
      console.log('Seeded CategoryAvailability defaults successfully.');
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

