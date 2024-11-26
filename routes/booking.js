const express = require('express');
const { authenticate, restrict } = require('./../auth/verifyToken.js');
const {
  getCheckoutSession,
  completeAppointment,
  cancelAppointment,
  getAllAppointments,
} = require('../controllers/bookingControllers.js');

const router = express.Router();

router.post('/checkout-session/:doctorId', authenticate, getCheckoutSession);
router.put('/complete/:bookingId', authenticate, completeAppointment);
router.put('/cancel/:bookingId', authenticate, cancelAppointment);
router.get('/my-appointments', authenticate, getAllAppointments);

module.exports = router;
