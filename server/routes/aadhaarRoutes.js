import express from 'express';

const router = express.Router();

// In-memory store for active demo OTP verification sessions
const otpSessions = new Map();

// Helper to clean up expired sessions (> 10 mins)
const cleanupExpiredSessions = () => {
  const now = Date.now();
  for (const [id, session] of otpSessions.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) {
      otpSessions.delete(id);
    }
  }
};

// POST /api/aadhaar/send-otp
router.post('/send-otp', (req, res) => {
  try {
    cleanupExpiredSessions();
    const { aadhaarNumber, consent } = req.body;

    if (!consent) {
      return res.status(400).json({
        success: false,
        message: 'Consent is required to initiate simulated identity verification.',
      });
    }

    if (!aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number is required.',
      });
    }

    // Clean any spaces or hyphens
    const cleanNumber = String(aadhaarNumber).replace(/\s+/g, '').replace(/-/g, '');

    // Validate 12 digits
    if (!/^\d{12}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar format. It must be exactly 12 numeric digits.',
      });
    }

    // Validate starts with 2-9
    const firstDigit = parseInt(cleanNumber[0], 10);
    if (firstDigit < 2 || firstDigit > 9) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number must start with a digit between 2 and 9 (UIDAI rule: cannot start with 0 or 1).',
      });
    }

    const aadhaarLast4 = cleanNumber.slice(-4);
    // Generate a simulated 6-digit OTP
    const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = 'ses_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

    otpSessions.set(sessionId, {
      aadhaarLast4,
      otp: demoOtp,
      createdAt: Date.now(),
      verified: false,
      maskedAadhaar: `XXXX-XXXX-${aadhaarLast4}`,
    });

    return res.json({
      success: true,
      message: `Simulated OTP dispatched to mobile linked with Aadhaar ending in ${aadhaarLast4}`,
      sessionId,
      aadhaarLast4,
      maskedAadhaar: `XXXX-XXXX-${aadhaarLast4}`,
      demoOtp, // Provided for effortless prototype testing
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while generating OTP.' });
  }
});

// POST /api/aadhaar/verify-otp
router.post('/verify-otp', (req, res) => {
  try {
    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
      return res.status(400).json({ success: false, message: 'Session ID and OTP are required.' });
    }

    const session = otpSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Verification session expired or not found. Please request a new OTP.',
      });
    }

    // Accept actual generated OTP or generic prototype fallback "123456"
    const cleanedOtp = String(otp).trim();
    if (cleanedOtp !== session.otp && cleanedOtp !== '123456') {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please enter the simulated OTP shown or use 123456.',
      });
    }

    session.verified = true;
    session.verifiedAt = new Date().toISOString();

    return res.json({
      success: true,
      message: 'Aadhaar identity verified successfully (Simulated Prototype Mode)',
      data: {
        sessionId,
        aadhaarLast4: session.aadhaarLast4,
        maskedAadhaar: session.maskedAadhaar,
        verified: true,
        verifiedAt: session.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying OTP.' });
  }
});

export default router;
