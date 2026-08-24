const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const env = require('../config/env');

const register = async (req, res) => {
  try {
    const { name, email, phone, password, farmDetails } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: cleanEmail,
      phone: phone || '',
      password: passwordHash,
      farmDetails: farmDetails || {
        farmType: 'Vegetable Farming',
        farmSizeAcres: 5,
        state: 'Gujarat'
      }
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: 'Farmer account registered successfully!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Profile Details & Email
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar, farmDetails } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'This email address is already registered to another account.' });
        }
        user.email = cleanEmail;
      }
    }

    if (farmDetails) {
      user.farmDetails = {
        ...user.farmDetails,
        ...farmDetails
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Forgot Password - Request OTP / Reset Token
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No farmer account found with this email address.' });
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Password reset OTP has been sent to ${cleanEmail}. (Demo OTP: ${otp})`,
      demoOtp: otp
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password with OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedToken = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add New Delivery Address
const addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, villageCity, district, state, pincode, landmark, addressType, isDefault } = req.body;

    if (!street || !villageCity || !district || !pincode) {
      return res.status(400).json({ success: false, message: 'Street/Farm plot, Village/City, District, and Pincode are required.' });
    }

    const user = req.user;
    const shouldBeDefault = Boolean(isDefault) || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      fullName: fullName || user.name,
      phone: phone || user.phone,
      street,
      villageCity,
      district,
      state: state || 'Gujarat',
      pincode,
      landmark: landmark || '',
      addressType: addressType || 'Farm',
      isDefault: shouldBeDefault
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'New farm delivery address added successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Saved Address
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, street, villageCity, district, state, pincode, landmark, addressType, isDefault } = req.body;

    const user = req.user;
    const address = user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (villageCity) address.villageCity = villageCity;
    if (district) address.district = district;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (landmark !== undefined) address.landmark = landmark;
    if (addressType) address.addressType = addressType;

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
      address.isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = req.user;

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address removed successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Set Default Address
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = req.user;

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    user.addresses.forEach(addr => { addr.isDefault = false; });
    address.isDefault = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Default farm delivery address updated.',
      addresses: user.addresses
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('user_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production'
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  logout
};
