const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
  },
  bloodType: {
    type: String,
  },
  appointments: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'Appointment',
    },
  ],
});

const User = mongoose.model('User', userSchema);
module.exports = User;
