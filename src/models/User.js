import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  number: String,
  postal: String,
  city: String,
  province: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  name: { type: String, default: null },
  lastName: { type: String, default: null },
  nif: { type: String, default: null },
  role: { type: String, enum: ['admin', 'guest'], default: 'admin', index: true },
  status: { type: String, enum: ['pending', 'verified'], default: 'pending', index: true },
  verificationCode: { type: String, default: null },
  verificationAttempts: { type: Number, default: 3 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
  address: addressSchema,
  refreshToken: { type: String, default: null, select: false },
  deleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual fullName
userSchema.virtual('fullName').get(function () {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`;
  return this.name || null;
});

export default mongoose.model('User', userSchema);
