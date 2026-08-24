const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  street: { type: String, default: '' },
  villageCity: { type: String, default: '' },
  city: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: 'Gujarat' },
  pincode: { type: String, default: '' },
  landmark: { type: String, default: '' },
  addressType: { type: String, enum: ['Farm', 'Home', 'Warehouse', 'Cooperative'], default: 'Farm' },
  isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  farmDetails: {
    farmType: { type: String, default: 'Vegetable & Crop Farming' },
    farmSizeAcres: { type: Number, default: 5 },
    state: { type: String, default: 'Gujarat' },
    district: { type: String, default: '' },
    pincode: { type: String, default: '' },
    primaryCrops: { type: [String], default: ['Cotton', 'Sugarcane', 'Paddy'] },
    preferredLanguage: { type: String, default: 'Hindi / English' }
  },
  addresses: [addressSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
