import express from 'express';
import Application from '../models/Application.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply auth & admin guard to all routes in this router
router.use(authenticateToken);
router.use(requireAdmin);

// Helper to generate realistic EPIC number
const generateEpicNumber = (state) => {
  const stateCodes = {
    'Delhi': 'DLH',
    'Maharashtra': 'MHX',
    'Karnataka': 'KAR',
    'Telangana': 'TSG',
    'Andhra Pradesh': 'APR',
    'Tamil Nadu': 'TND',
    'Uttar Pradesh': 'UPR',
    'West Bengal': 'WBG',
  };
  const prefix = stateCodes[state] || 'MAT';
  const digits = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${digits}`;
};

// GET /api/admin/stats - Admin Dashboard Metrics
router.get('/stats', async (req, res) => {
  try {
    const total = await Application.countDocuments();
    const submitted = await Application.countDocuments({ status: 'Submitted' });
    const underReview = await Application.countDocuments({ status: 'Under Review' });
    const approved = await Application.countDocuments({ status: 'Approved' });
    const rejected = await Application.countDocuments({ status: 'Rejected' });
    const duplicates = await Application.countDocuments({ duplicateFlag: true });

    // Aggregate state-wise counts
    const stateStats = await Application.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        submitted,
        underReview,
        approved,
        rejected,
        duplicates,
        stateStats,
      },
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute dashboard stats.' });
  }
});

// GET /api/admin/applications - List and filter applications
router.get('/applications', async (req, res) => {
  try {
    const { status, search, duplicateOnly } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (duplicateOnly === 'true') {
      filter.duplicateFlag = true;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { applicationId: searchRegex },
        { fullName: searchRegex },
        { epicNumber: searchRegex },
        { mobile: searchRegex },
        { district: searchRegex },
        { state: searchRegex },
      ];
    }

    const applications = await Application.find(filter).sort({ submittedAt: -1 });

    return res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Admin Applications List Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
});

// GET /api/admin/applications/:id - View single application
router.get('/applications/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    return res.json({ success: true, application });
  } catch (error) {
    console.error('Fetch Application Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving application.' });
  }
});

// PATCH /api/admin/applications/:id/status - Review, Approve, Reject
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const { status, remarks = '', rejectionReason = '' } = req.body;

    const validStatuses = ['Submitted', 'Under Review', 'Approved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found.' });
    }

    application.status = status;
    application.updatedAt = new Date();

    if (remarks) application.adminRemarks = remarks;
    if (rejectionReason) application.rejectionReason = rejectionReason;

    // If Approved, generate simulated EPIC number & polling station details
    if (status === 'Approved' && !application.epicNumber) {
      application.epicNumber = generateEpicNumber(application.state);
      application.pollingStation = `Govt. High School, Room No. ${Math.floor(1 + Math.random() * 8)}, ${application.villageOrTown}`;
      application.partNumber = `${Math.floor(100 + Math.random() * 250)}`;
      application.serialNumber = `${Math.floor(10 + Math.random() * 900)}`;
    }

    // Add status history entry
    application.statusHistory.push({
      status,
      timestamp: new Date(),
      remarks: remarks || `Status changed to ${status} by Electoral Review Officer.`,
      updatedBy: `${req.user.name} (Admin)`,
    });

    await application.save();

    return res.json({
      success: true,
      message: `Application #${application.applicationId} status updated to ${status}.`,
      application,
    });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
});

// POST /api/admin/seed-sample - Seed demo applications if needed
router.post('/seed-sample', async (req, res) => {
  try {
    const { force } = req.query;
    const count = await Application.countDocuments();
    if (count > 0 && force !== 'true') {
      // Check if we have at least one rejected and one duplicate
      const rejectedCount = await Application.countDocuments({ status: 'Rejected' });
      const dupCount = await Application.countDocuments({ duplicateFlag: true });
      if (rejectedCount === 0 || dupCount === 0) {
        // Add missing diverse demo records so all filters work
        const extraApps = [];
        if (rejectedCount === 0) {
          extraApps.push({
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
            adminRemarks: 'Address document submitted does not match current residency in constituency.',
            rejectionReason: 'Supporting document mismatch',
            statusHistory: [
              { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 48), remarks: 'Form 6 submitted online', updatedBy: 'Applicant' },
              { status: 'Under Review', timestamp: new Date(Date.now() - 3600000 * 24), remarks: 'Scrutiny by Electoral Registration Officer', updatedBy: 'Chief Electoral Officer (Admin)' },
              { status: 'Rejected', timestamp: new Date(Date.now() - 3600000 * 6), remarks: 'Address proof mismatch', updatedBy: 'Chief Electoral Officer (Admin)' },
            ],
          });
        }
        if (dupCount === 0) {
          extraApps.push({
            applicationId: 'MAT-2026-77104',
            aadhaarLast4: '3489',
            aadhaarVerified: true,
            consentGiven: true,
            fullName: 'Aarav Sharma (Duplicate Attempt)',
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
        if (extraApps.length > 0) {
          await Application.insertMany(extraApps);
          return res.json({ success: true, message: `Added ${extraApps.length} sample applications for Rejected/Duplicate filters.` });
        }
      }
      return res.json({ success: true, message: `Database already has ${count} applications with all categories represented.` });
    }

    const sampleApps = [
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
          { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 24 * 3), remarks: 'Applied online' },
          { status: 'Under Review', timestamp: new Date(Date.now() - 3600000 * 24 * 2), remarks: 'Documents checked' },
          { status: 'Approved', timestamp: new Date(Date.now() - 3600000 * 24 * 1), remarks: 'EPIC card generated' },
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
          { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 12), remarks: 'Submitted by citizen' },
          { status: 'Under Review', timestamp: new Date(Date.now() - 3600000 * 4), remarks: 'Field verification in progress by BLO' },
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
      },
      {
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
        adminRemarks: 'Address document submitted does not match residency records.',
        statusHistory: [
          { status: 'Submitted', timestamp: new Date(Date.now() - 3600000 * 48), remarks: 'Form 6 submitted online', updatedBy: 'Applicant' },
          { status: 'Rejected', timestamp: new Date(Date.now() - 3600000 * 6), remarks: 'Rejected due to document mismatch', updatedBy: 'Chief Electoral Officer (Admin)' },
        ],
      },
      {
        applicationId: 'MAT-2026-77104',
        aadhaarLast4: '3489',
        aadhaarVerified: true,
        consentGiven: true,
        fullName: 'Aarav Sharma (Duplicate Attempt)',
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
      },
    ];

    await Application.insertMany(sampleApps);

    return res.json({ success: true, message: 'All demo applications (Submitted, Under Review, Approved, Rejected, Duplicate) seeded successfully!' });
  } catch (error) {
    console.error('Seed Sample Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to seed sample data.' });
  }
});

export default router;
