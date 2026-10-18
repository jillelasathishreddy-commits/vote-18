import express from 'express';
import Application from '../models/Application.js';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to calculate exact age from DOB
const calculateAge = (dobString) => {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper to generate Application ID
const generateApplicationId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `MAT-${year}-${randomNum}`;
};

// POST /api/applications - Submit new Form 6 voter application
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      aadhaarLast4,
      consentGiven = true,
      fullName,
      relativeName,
      relationType = 'Father',
      gender,
      dob,
      mobile,
      email = '',
      houseNo,
      street,
      villageOrTown,
      postOffice,
      pincode,
      district,
      state,
      assemblyConstituency,
      photoUrl = '',
      ageProofType = 'Aadhaar Card (Simulated)',
      addressProofType = 'Aadhaar Card (Simulated)',
    } = req.body;

    // Field validations
    if (!fullName || !relativeName || !gender || !dob || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Personal details (Full Name, Relative Name, Gender, Date of Birth, and Mobile) are required.',
      });
    }

    if (!houseNo || !street || !villageOrTown || !postOffice || !pincode || !district || !state || !assemblyConstituency) {
      return res.status(400).json({
        success: false,
        message: 'Complete address details and Assembly Constituency are required.',
      });
    }

    if (!aadhaarLast4 || aadhaarLast4.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Valid 4-digit Aadhaar verification suffix is required.',
      });
    }

    // Age validation
    const age = calculateAge(dob);
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: `Ineligible: Indian voter registration requires applicant to be at least 18 years old. Calculated age is ${age} years.`,
      });
    }

    // Duplicate Detection Check
    let duplicateFlag = false;
    let duplicateReason = '';

    const existingMatch = await Application.findOne({
      $or: [
        {
          fullName: new RegExp(`^${fullName.trim()}$`, 'i'),
          dob: new Date(dob),
        },
        {
          aadhaarLast4,
          fullName: new RegExp(`^${fullName.trim()}$`, 'i'),
        },
      ],
    });

    if (existingMatch) {
      duplicateFlag = true;
      duplicateReason = `Potential duplicate application flagged: closely matches existing record #${existingMatch.applicationId} (${existingMatch.status})`;
    }

    const applicationId = generateApplicationId();

    const application = new Application({
      applicationId,
      userId: req.user ? req.user._id : null,
      userEmail: req.user ? req.user.email : email,
      aadhaarLast4,
      aadhaarVerified: true,
      consentGiven: Boolean(consentGiven),
      consentTimestamp: new Date(),
      fullName: fullName.trim(),
      relativeName: relativeName.trim(),
      relationType,
      gender,
      dob: new Date(dob),
      calculatedAge: age,
      isEligibleAge: true,
      mobile: mobile.trim(),
      email: email ? email.trim() : (req.user ? req.user.email : ''),
      houseNo: houseNo.trim(),
      street: street.trim(),
      villageOrTown: villageOrTown.trim(),
      postOffice: postOffice.trim(),
      pincode: pincode.trim(),
      district: district.trim(),
      state: state.trim(),
      assemblyConstituency: assemblyConstituency.trim(),
      photoUrl,
      ageProofType,
      addressProofType,
      status: 'Submitted',
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: new Date(),
          remarks: 'Application submitted successfully via Matdata Portal with Aadhaar-verified identity.',
          updatedBy: req.user ? `${req.user.name} (${req.user.role})` : 'Applicant Self-Service',
        },
      ],
      duplicateFlag,
      duplicateReason,
    });

    await application.save();

    return res.status(201).json({
      success: true,
      message: 'Voter registration application submitted successfully!',
      application,
    });
  } catch (error) {
    console.error('Submit Application Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while submitting application.' });
  }
});

// GET /api/applications/track/:id - Public status tracking by Reference ID
router.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.trim().toUpperCase();

    const application = await Application.findOne({
      $or: [{ applicationId: query }, { epicNumber: query }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: `No voter application or EPIC record found matching "${id}". Please check your Reference Number.`,
      });
    }

    return res.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error('Track Application Error:', error);
    return res.status(500).json({ success: false, message: 'Server error tracking application.' });
  }
});

// GET /api/applications/my - Get applications of logged-in user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({
      $or: [{ userId: req.user._id }, { userEmail: req.user.email }],
    }).sort({ submittedAt: -1 });

    return res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Fetch User Applications Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
});

export default router;
