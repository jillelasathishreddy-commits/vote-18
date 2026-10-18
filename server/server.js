import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import aadhaarRoutes from './routes/aadhaarRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import User from './models/User.js';
import Application from './models/Application.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Vote 18 Voter Registration System API',
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/aadhaar', aadhaarRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Serve Production Client Assets if built
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving production frontend build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API paths
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Database connection & initial seeding
const connectDBAndSeed = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Reconnection will be handled automatically.');
    });
    mongoose.connection.on('error', (err) => {
      console.error('⚠️ MongoDB connection error:', err.message);
    });

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      maxPoolSize: 10,
    });
    console.log('✅ Connected to MongoDB Atlas successfully!');

    // Seed default Admin if not exists
    const adminEmails = ['admin@vote18.in', 'admin@matdata.gov.in'];
    for (const adminEmail of adminEmails) {
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const adminUser = new User({
          name: 'Chief Electoral Officer (Admin)',
          email: adminEmail,
          password: 'admin123',
          role: 'admin',
          mobile: '9876543210',
        });
        await adminUser.save();
        console.log(`✅ Default Admin created: ${adminEmail} (password: admin123)`);
      }
    }

    // Seed default Citizen User if not exists
    const citizenEmails = ['user@vote18.in', 'citizen@matdata.gov.in'];
    for (const citizenEmail of citizenEmails) {
      const existingCitizen = await User.findOne({ email: citizenEmail });
      if (!existingCitizen) {
        const citizenUser = new User({
          name: 'Citizen User',
          email: citizenEmail,
          password: 'user123',
          role: 'user',
          mobile: '9848012345',
        });
        await citizenUser.save();
        console.log(`✅ Default Citizen created: ${citizenEmail} (password: user123)`);
      }
    }

    // Ensure sample applications for all statuses exist (Submitted, Under Review, Approved, Rejected, Duplicate)
    const appCount = await Application.countDocuments();
    const rejectedCount = await Application.countDocuments({ status: 'Rejected' });
    const duplicateCount = await Application.countDocuments({ duplicateFlag: true });

    if (appCount === 0 || rejectedCount === 0 || duplicateCount === 0) {
      console.log('Ensuring comprehensive voter applications across all statuses...');
      const sampleApplications = [];

      if (appCount === 0) {
        sampleApplications.push(
          {
            applicationId: 'MAT-2026-10492',
            aadhaarLast4: '3489',
            aadhaarVerified: true,
            consentGiven: true,
            fullName: 'Aarav Sharma',
            relativeName: 'Rajesh Sharma',
            relationType: 'Father',
            gender: 'Male',
            dob: new Date('2004-05-14'),
            calculatedAge: 21,
            isEligibleAge: true,
            mobile: '9876543210',
            email: 'aarav.sharma@example.com',
            houseNo: '42-B, Shanti Vihar',
            street: 'Ring Road',
            villageOrTown: 'New Delhi',
            postOffice: 'Lajpat Nagar',
            pincode: '110024',
            district: 'South East Delhi',
            state: 'Delhi',
            assemblyConstituency: 'Kasturba Nagar',
            status: 'Approved',
            epicNumber: 'DLH7849201',
            pollingStation: 'Govt. Boys Senior Secondary School, Room 3',
            partNumber: '118',
            serialNumber: '342',
            statusHistory: [
              { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 24 * 3), remarks: 'Applied online with verified Aadhaar suffix', updatedBy: 'Applicant' },
              { status: 'Under Review', timestamp: new Date(Date.now() - 3600000 * 24 * 2), remarks: 'Form 6 verification in progress', updatedBy: 'Chief Electoral Officer (Admin)' },
              { status: 'Approved', timestamp: new Date(Date.now() - 3600000 * 24 * 1), remarks: 'Electoral eligibility confirmed. EPIC generated.', updatedBy: 'Chief Electoral Officer (Admin)' },
            ],
          },
          {
            applicationId: 'MAT-2026-89214',
            aadhaarLast4: '7190',
            aadhaarVerified: true,
            consentGiven: true,
            fullName: 'Priya Sundaram',
            relativeName: 'Venkatesh Sundaram',
            relationType: 'Father',
            gender: 'Female',
            dob: new Date('2005-09-22'),
            calculatedAge: 20,
            isEligibleAge: true,
            mobile: '9845012345',
            email: 'priya.s@example.com',
            houseNo: 'Flat 304, Green Meadows',
            street: '100ft Road, Indiranagar',
            villageOrTown: 'Bengaluru',
            postOffice: 'HAL 2nd Stage',
            pincode: '560038',
            district: 'Bengaluru Urban',
            state: 'Karnataka',
            assemblyConstituency: 'Shanti Nagar',
            status: 'Under Review',
            statusHistory: [
              { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 18), remarks: 'Initial submission completed', updatedBy: 'Applicant' },
              { status: 'Under Review', timestamp: new Date(Date.now() - 3600000 * 4), remarks: 'Field verification assigned to BLO', updatedBy: 'Chief Electoral Officer (Admin)' },
            ],
          },
          {
            applicationId: 'MAT-2026-64103',
            aadhaarLast4: '8821',
            aadhaarVerified: true,
            consentGiven: true,
            fullName: 'Vikramaditya Roy',
            relativeName: 'Subhasish Roy',
            relationType: 'Father',
            gender: 'Male',
            dob: new Date('2003-11-08'),
            calculatedAge: 22,
            isEligibleAge: true,
            mobile: '9830198765',
            email: 'vikram.roy@example.com',
            houseNo: '14/2 Park Street',
            street: 'Park Street',
            villageOrTown: 'Kolkata',
            postOffice: 'Park Street PO',
            pincode: '700016',
            district: 'Kolkata',
            state: 'West Bengal',
            assemblyConstituency: 'Bhowanipore',
            status: 'Submitted',
            statusHistory: [
              { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 2), remarks: 'New application received and queued for Electoral Officer review.', updatedBy: 'Applicant' },
            ],
          }
        );
      }

      if (rejectedCount === 0) {
        sampleApplications.push({
          applicationId: 'MAT-2026-33910',
          aadhaarLast4: '5512',
          aadhaarVerified: true,
          consentGiven: true,
          fullName: 'Rohan Mehta',
          relativeName: 'Sanjay Mehta',
          relationType: 'Father',
          gender: 'Male',
          dob: new Date('2005-02-18'),
          calculatedAge: 21,
          isEligibleAge: true,
          mobile: '9811098765',
          email: 'rohan.m@example.com',
          houseNo: '56-C, Civil Lines',
          street: 'MG Road',
          villageOrTown: 'Jaipur',
          postOffice: 'Civil Lines PO',
          pincode: '302006',
          district: 'Jaipur',
          state: 'Rajasthan',
          assemblyConstituency: 'Civil Lines',
          status: 'Rejected',
          rejectionReason: 'Supporting document mismatch',
          adminRemarks: 'Address document submitted does not match residency in constituency.',
          statusHistory: [
            { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 48), remarks: 'Form 6 submitted online', updatedBy: 'Applicant' },
            { status: 'Rejected', timestamp: new Date(Date.now() - 3600000 * 6), remarks: 'Rejected due to document mismatch', updatedBy: 'Chief Electoral Officer (Admin)' },
          ],
        });
      }

      if (duplicateCount === 0) {
        sampleApplications.push({
          applicationId: 'MAT-2026-77104',
          aadhaarLast4: '3489',
          aadhaarVerified: true,
          consentGiven: true,
          fullName: 'Aarav Sharma (Duplicate Suffix)',
          relativeName: 'Rajesh Sharma',
          relationType: 'Father',
          gender: 'Male',
          dob: new Date('2004-05-14'),
          calculatedAge: 21,
          isEligibleAge: true,
          mobile: '9876543210',
          email: 'aarav.sharma2@example.com',
          houseNo: '42-B, Shanti Vihar',
          street: 'Ring Road',
          villageOrTown: 'New Delhi',
          postOffice: 'Lajpat Nagar',
          pincode: '110024',
          district: 'South East Delhi',
          state: 'Delhi',
          assemblyConstituency: 'Kasturba Nagar',
          status: 'Rejected',
          duplicateFlag: true,
          duplicateReason: 'Aadhaar suffix 3489 already registered under EPIC DLH7849201.',
          rejectionReason: 'Duplicate voter registration detected',
          adminRemarks: 'Flagged by automated duplicate voter detection engine.',
          statusHistory: [
            { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 12), remarks: 'Online submission received', updatedBy: 'Applicant' },
            { status: 'Rejected', timestamp: new Date(Date.now() - 3600000 * 2), remarks: 'Rejected due to duplicate Aadhaar suffix match', updatedBy: 'Chief Electoral Officer (Admin)' },
          ],
        });
      }

      if (sampleApplications.length > 0) {
        await Application.insertMany(sampleApplications);
        console.log(`✅ ${sampleApplications.length} sample applications seeded successfully!`);
      }
    }
  } catch (error) {
    console.error('❌ MongoDB Connection/Seeding Error:', error);
  }
};

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Matdata Server running on http://localhost:${PORT}`);
  await connectDBAndSeed();
});
