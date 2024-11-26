const User = require('../models/userModel');
const Doctor = require('../models/DoctorSchema');
const Booking = require('../models/BookingSchema');
const Stripe = require('stripe');
const moment = require('moment');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = async (req, res) => {
  try {
    // Get currently booked doctor
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Get currently logged-in user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Not authorized user',
      });
    }

    // Validate the date and time
    const { date, time } = req.body;
    const appointmentDateTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
    if (!appointmentDateTime.isValid() || appointmentDateTime.isBefore(moment())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot select date and time in the past',
      });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${process.env.CLIENT_SITE_URL}/checkout-success`,
      cancel_url: `${req.protocol}://${req.get('host')}/doctors/${doctor.id}`,
      customer_email: user.email,
      client_reference_id: req.params.doctorId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: doctor.ticketPrice * 100,
            product_data: {
              name: doctor.name,
              description: doctor.bio,
              images: [doctor.photo],
            },
          },
          quantity: 1,
        },
      ],
    });

    // Create new booking
    const booking = new Booking({
      doctor: doctor._id,
      user: user._id,
      ticketPrice: doctor.ticketPrice,
      session: session.id,
      appointmentDate: date,
      appointmentTime: time,
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Successfully created checkout session',
      session,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session',
    });
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log(`Complete Appointment: Received bookingId: ${bookingId}`);
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "completed" },
      { new: true }
    );

    if (!booking) {
      console.log(`Complete Appointment: Booking not found for bookingId: ${bookingId}`);
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment completed successfully",
      booking,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error completing the appointment",
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log(`Cancel Appointment: Received bookingId: ${bookingId}`);
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "cancelled" },
      { new: true }
    );

    if (!booking) {
      console.log(`Cancel Appointment: Booking not found for bookingId: ${bookingId}`);
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      booking,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error cancelling the appointment",
    });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
      // Retrieve appointments from bookings for specific user and populate doctor details
      const bookings = await Booking.find({ user: req.userId }).populate('doctor', '-password');

      res.status(200).json({
          success: true,
          message: "Appointments fetched successfully",
          data: bookings
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: "Failed to fetch appointments",
          error: error.message
      });
  }
};
