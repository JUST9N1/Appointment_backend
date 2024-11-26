const request = require('supertest');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');

const User = require('../models/userModel');
const Doctor = require('../models/DoctorSchema');
const Booking = require('../models/BookingSchema');
const { getCheckoutSession, completeAppointment, cancelAppointment, getAllAppointments } = require('../controllers/bookingControllers.js');

// Mock the models
jest.mock('../models/userModel');
jest.mock('../models/DoctorSchema');
jest.mock('../models/BookingSchema');

// Mock stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

const app = express();
app.use(express.json());

app.post('/appointments/checkout/:doctorId', getCheckoutSession);
app.patch('/appointments/complete/:bookingId', completeAppointment);
app.patch('/appointments/cancel/:bookingId', cancelAppointment);
app.get('/appointments', getAllAppointments);

describe('Appointment Controller', () => {
    describe('getCheckoutSession', () => {
        it('should create a checkout session and save a booking successfully', async () => {
            const reqParams = { doctorId: 'doctor123' };
            const reqBody = { date: '2024-09-01', time: '10:00' };
            const reqUser = { userId: 'user123' };

            const doctor = {
                _id: 'doctor123',
                name: 'Dr. Smith',
                bio: 'A great doctor',
                photo: 'photo_url',
                ticketPrice: 100,
            };

            const user = {
                _id: 'user123',
                email: 'user@example.com',
            };

            const session = {
                id: 'session123',
                url: 'https://checkout.stripe.com/session123',
            };

            Doctor.findById.mockResolvedValue(doctor);
            User.findById.mockResolvedValue(user);
            stripe.checkout.sessions.create.mockResolvedValue(session);
            Booking.prototype.save = jest.fn().mockResolvedValue(true);

            const response = await request(app)
                .post(`/appointments/checkout/${reqParams.doctorId}`)
                .set('userId', reqUser.userId)
                .send(reqBody);

            expect(Doctor.findById).toHaveBeenCalledWith(reqParams.doctorId);
            expect(User.findById).toHaveBeenCalledWith(reqUser.userId);
            expect(stripe.checkout.sessions.create).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.session.id).toBe('session123');
        });

        it('should return 404 if the doctor is not found', async () => {
            Doctor.findById.mockResolvedValue(null);

            const response = await request(app)
                .post('/appointments/checkout/unknownDoctorId')
                .send({ date: '2024-09-01', time: '10:00' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Doctor not found');
        });

        it('should return 400 if the date and time are in the past', async () => {
            const response = await request(app)
                .post('/appointments/checkout/doctor123')
                .send({ date: '2020-01-01', time: '10:00' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot select date and time in the past');
        });

        it('should return 500 if an error occurs', async () => {
            Doctor.findById.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/appointments/checkout/doctor123')
                .send({ date: '2024-09-01', time: '10:00' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error creating checkout session');
        });
    });

    describe('completeAppointment', () => {
        it('should complete the appointment successfully', async () => {
            const bookingId = 'booking123';

            Booking.findByIdAndUpdate.mockResolvedValue({ _id: bookingId, status: 'completed' });

            const response = await request(app)
                .patch(`/appointments/complete/${bookingId}`);

            expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(bookingId, { status: 'completed' }, { new: true });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.booking.status).toBe('completed');
        });

        it('should return 404 if the booking is not found', async () => {
            const bookingId = 'unknownBookingId';

            Booking.findByIdAndUpdate.mockResolvedValue(null);

            const response = await request(app)
                .patch(`/appointments/complete/${bookingId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Booking not found');
        });

        it('should return 500 if an error occurs', async () => {
            Booking.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .patch(`/appointments/complete/booking123`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error completing the appointment');
        });
    });

    describe('cancelAppointment', () => {
        it('should cancel the appointment successfully', async () => {
            const bookingId = 'booking123';

            Booking.findByIdAndUpdate.mockResolvedValue({ _id: bookingId, status: 'cancelled' });

            const response = await request(app)
                .patch(`/appointments/cancel/${bookingId}`);

            expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(bookingId, { status: 'cancelled' }, { new: true });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.booking.status).toBe('cancelled');
        });

        it('should return 404 if the booking is not found', async () => {
            const bookingId = 'unknownBookingId';

            Booking.findByIdAndUpdate.mockResolvedValue(null);

            const response = await request(app)
                .patch(`/appointments/cancel/${bookingId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Booking not found');
        });

        it('should return 500 if an error occurs', async () => {
            Booking.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .patch(`/appointments/cancel/booking123`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error cancelling the appointment');
        });
    });

    describe('getAllAppointments', () => {
        it('should fetch all appointments for the user successfully', async () => {
            const reqUser = { userId: 'user123' };
            const bookings = [
                { _id: 'booking1', doctor: { name: 'Dr. Smith' }, status: 'completed' },
                { _id: 'booking2', doctor: { name: 'Dr. John' }, status: 'pending' }
            ];

            Booking.find.mockResolvedValue(bookings);

            const response = await request(app)
                .get('/appointments')
                .set('userId', reqUser.userId);

            expect(Booking.find).toHaveBeenCalledWith({ user: reqUser.userId });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        it('should return 500 if an error occurs while fetching appointments', async () => {
            Booking.find.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/appointments')
                .set('userId', 'user123');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to fetch appointments');
        });
    });
});
