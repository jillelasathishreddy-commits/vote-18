import React, { useState } from 'react';
import { ShieldCheck, Calendar, MapPin, User, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi (NCT)',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

export default function DetailsStep3({ verificationData, onSubmitted, onBack }) {
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.name || 'Sathish Reddy',
    relativeName: 'Venkata Reddy',
    relationType: 'Father',
    gender: 'Male',
    dob: '2004-03-20',
    mobile: user?.mobile || '9848012345',
    email: user?.email || 'sathish.reddy@example.com',
    houseNo: 'Plot No. 84, H.No 3-5-112',
    street: 'Madhapur Main Road',
    villageOrTown: 'Hyderabad',
    postOffice: 'Madhapur SO',
    pincode: '500081',
    district: 'Hyderabad',
    state: 'Telangana',
    assemblyConstituency: 'Serilingampally (AC-052)',
    ageProofType: 'Aadhaar Card (Simulated)',
    addressProofType: 'Aadhaar Card (Simulated)',
    photoUrl: SAMPLE_PHOTO,
    declaration: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate age
  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = calculateAge(formData.dob);
  const isEligibleAge = currentAge >= 18;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutofillComplete = () => {
    setFormData({
      fullName: 'Sathish Reddy',
      relativeName: 'Venkata Reddy',
      relationType: 'Father',
      gender: 'Male',
      dob: '2004-03-20',
      mobile: '9848012345',
      email: 'sathish.reddy@example.com',
      houseNo: 'Plot No. 84, H.No 3-5-112',
      street: 'Madhapur Main Road',
      villageOrTown: 'Hyderabad',
      postOffice: 'Madhapur SO',
      pincode: '500081',
      district: 'Hyderabad',
      state: 'Telangana',
      assemblyConstituency: 'Serilingampally (AC-052)',
      ageProofType: 'Aadhaar Card (Simulated)',
      addressProofType: 'Aadhaar Card (Simulated)',
      photoUrl: SAMPLE_PHOTO,
      declaration: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEligibleAge) {
      setError(`Ineligible: Applicant must be 18+ to register. Current age is ${currentAge} years.`);
      return;
    }

    if (!formData.declaration) {
      setError('Please accept the statutory declaration to submit your application.');
      return;
    }

    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          aadhaarLast4: verificationData.aadhaarLast4,
          consentGiven: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Application submission failed.');
      }

      onSubmitted(data.application);
    } catch (err) {
      setError(err.message || 'Error submitting application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-10 transition-all">
      {/* Aadhaar Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mb-8 bg-emerald-50/80 border border-emerald-200 rounded-lg">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-950">Aadhaar Identity Verified: </span>
            <span className="font-mono text-emerald-800 font-bold">XXXX-XXXX-{verificationData.aadhaarLast4}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAutofillComplete}
          className="text-xs text-[#EA580C] hover:text-[#C2410C] font-semibold flex items-center gap-1 cursor-pointer transition-colors bg-white px-2.5 py-1 rounded border border-orange-200"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Reset / Fill Form 6 Demo Data
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Form 6 — Voter Registration Details
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Official statutory format prescribed under Registration of Electors Rules, 1960.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-[#EA580C]" />
            1. Applicant Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Full Name (as per ID) *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Sathish Reddy"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800 focus:ring-1 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Relation Type & Name *
              </label>
              <div className="flex gap-2">
                <select
                  name="relationType"
                  value={formData.relationType}
                  onChange={handleChange}
                  className="w-28 px-2 py-2.5 rounded-lg border border-stone-300 text-xs bg-stone-50 focus:outline-none focus:border-stone-800"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Husband">Husband</option>
                  <option value="Legal Guardian">Guardian</option>
                </select>
                <input
                  type="text"
                  name="relativeName"
                  required
                  value={formData.relativeName}
                  onChange={handleChange}
                  placeholder="Relative's Full Name"
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800 focus:ring-1 focus:ring-stone-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus:outline-none focus:border-stone-800"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Third Gender">Third Gender</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dob"
                required
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus:outline-none focus:border-stone-800"
              />

              {/* Real-time Age Check Banner */}
              <div className="mt-1.5 flex items-center justify-between text-xs">
                {isEligibleAge ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Age: {currentAge} years · Eligible (18+)
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Age: {currentAge} years · Under 18 (Ineligible)
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="citizen@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Address Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#EA580C]" />
            2. Residential Address & Constituency
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                House / Building / Door No. *
              </label>
              <input
                type="text"
                name="houseNo"
                required
                value={formData.houseNo}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Street / Road / Locality *
              </label>
              <input
                type="text"
                name="street"
                required
                value={formData.street}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Village / Town / City *
              </label>
              <input
                type="text"
                name="villageOrTown"
                required
                value={formData.villageOrTown}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Post Office *
              </label>
              <input
                type="text"
                name="postOffice"
                required
                value={formData.postOffice}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                name="pincode"
                maxLength={6}
                required
                value={formData.pincode}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm font-mono focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                State / Union Territory *
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus:outline-none focus:border-stone-800"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                District *
              </label>
              <input
                type="text"
                name="district"
                required
                value={formData.district}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Assembly Constituency *
              </label>
              <input
                type="text"
                name="assemblyConstituency"
                required
                value={formData.assemblyConstituency}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Document Proofs & Photo */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#EA580C]" />
            3. Supporting Proofs & Photograph (Simulated)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-4">
              <div className="w-20 h-24 bg-stone-100 border border-stone-300 rounded-md overflow-hidden relative shadow-inner flex items-center justify-center">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Applicant" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-stone-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-700 mb-1">Passport Photo</label>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-medium border border-stone-300 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Age Proof Document
              </label>
              <select
                name="ageProofType"
                value={formData.ageProofType}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="Aadhaar Card (Simulated)">Aadhaar Card (Simulated)</option>
                <option value="Birth Certificate">Birth Certificate</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Class 10 Certificate">Class 10 Matriculation Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Address Proof Document
              </label>
              <select
                name="addressProofType"
                value={formData.addressProofType}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
              >
                <option value="Aadhaar Card (Simulated)">Aadhaar Card (Simulated)</option>
                <option value="Electricity / Water Bill">Electricity / Water Bill</option>
                <option value="Ration Card">Ration Card</option>
                <option value="Registered Rent Deed">Registered Rent Deed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Declaration */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="declaration"
              checked={formData.declaration}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#EA580C] focus:ring-[#EA580C]"
            />
            <span className="text-xs text-stone-700 leading-relaxed">
              I hereby declare that to the best of my knowledge and belief, I am a citizen of India and have attained the age of 18 years. I have not applied for inclusion in the electoral roll for any other constituency.
            </span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={!isEligibleAge || loading}
            className={`px-7 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 ${
              isEligibleAge && !loading
                ? 'bg-[#E86A33] hover:bg-[#d65b25] text-white shadow-sm cursor-pointer'
                : 'bg-[#F4C59E] text-white/90 cursor-not-allowed'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Submit Voter Application</span>
          </button>
        </div>
      </form>
    </div>
  );
}
