const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  role: {
    type: String,
    enum: ['patient', 'admin'],
    default: 'patient',
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  photo: {
    type: String,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
