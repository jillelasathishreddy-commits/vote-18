import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  userEmail: {
    type: String,
    trim: true,
  },
  // Aadhaar Verification Info (Simulated, Privacy-Preserving)
  aadhaarLast4: {
    type: String,
    required: true,
    length: 4,
  },
  aadhaarVerified: {
    type: Boolean,
    default: true,
  },
  consentGiven: {
    type: Boolean,
    required: true,
  },
  consentTimestamp: {
    type: Date,
    default: Date.now,
  },
  // Form 6 Personal Details
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  relativeName: {
    type: String,
    required: true,
    trim: true,
  },
  relationType: {
    type: String,
    enum: ['Father', 'Mother', 'Husband', 'Legal Guardian', 'Other'],
    default: 'Father',
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Third Gender', 'Other'],
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  calculatedAge: {
    type: Number,
    required: true,
  },
  isEligibleAge: {
    type: Boolean,
    default: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  // Address Details
  houseNo: {
    type: String,
    required: true,
    trim: true,
  },
  street: {
    type: String,
    required: true,
    trim: true,
  },
  villageOrTown: {
    type: String,
    required: true,
    trim: true,
  },
  postOffice: {
    type: String,
    required: true,
    trim: true,
  },
  pincode: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  assemblyConstituency: {
    type: String,
    required: true,
    trim: true,
  },
  // Documents
  photoUrl: {
    type: String,
    default: '',
  },
  ageProofType: {
    type: String,
    default: 'Aadhaar Card (Simulated)',
  },
  addressProofType: {
    type: String,
    default: 'Aadhaar Card (Simulated)',
  },
  // Workflow Status
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
    default: 'Submitted',
  },
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      remarks: String,
      updatedBy: String,
    },
  ],
  adminRemarks: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  duplicateFlag: {
    type: Boolean,
    default: false,
  },
  duplicateReason: {
    type: String,
    default: '',
  },
  // Official EPIC simulation on approval
  epicNumber: {
    type: String,
    default: '',
  },
  pollingStation: {
    type: String,
    default: '',
  },
  partNumber: {
    type: String,
    default: '',
  },
  serialNumber: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for high performance filtering and dashboard statistics
applicationSchema.index({ status: 1 });
applicationSchema.index({ duplicateFlag: 1 });
applicationSchema.index({ submittedAt: -1 });

export default mongoose.model('Application', applicationSchema);
