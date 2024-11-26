const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Doctor = require('../models/DoctorSchema');
const Admin = require('../models/AdminSchema');
const { signup, login, getTokenById } = require('../controllers/authController');

// Mock the models
jest.mock('../models/userModel');
jest.mock('../models/DoctorSchema');
jest.mock('../models/AdminSchema');

// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());

app.post('/auth/signup', signup);
app.post('/auth/login', login);
app.post('/auth/getTokenById', getTokenById);

describe('Auth Controller', () => {
    describe('signup', () => {
        it('should register a new patient user successfully', async () => {
            const reqBody = {
                email: 'patient@example.com',
                password: 'password123',
                name: 'Patient Name',
                role: 'patient',
                photo: 'photo_url',
                gender: 'male',
                phone: '1234567890'
            };

            User.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');
            User.prototype.save = jest.fn().mockResolvedValue(true);

            const response = await request(app).post('/auth/signup').send(reqBody);

            expect(User.findOne).toHaveBeenCalledWith({ email: reqBody.email });
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(reqBody.password, 'salt');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
        });

        it('should return 400 if user already exists', async () => {
            const reqBody = {
                email: 'patient@example.com',
                password: 'password123',
                name: 'Patient Name',
                role: 'patient'
            };

            User.findOne.mockResolvedValue({});

            const response = await request(app).post('/auth/signup').send(reqBody);

            expect(User.findOne).toHaveBeenCalledWith({ email: reqBody.email });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('User already exists');
        });

        it('should return 500 if an error occurs during registration', async () => {
            const reqBody = {
                email: 'patient@example.com',
                password: 'password123',
                name: 'Patient Name',
                role: 'patient'
            };

            User.findOne.mockRejectedValue(new Error('Database error'));

            const response = await request(app).post('/auth/signup').send(reqBody);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error, Try again');
        });
    });

    describe('login', () => {
        it('should log in the user successfully and return a token', async () => {
            const reqBody = {
                email: 'doctor@example.com',
                password: 'password123'
            };

            const user = {
                _id: 'someUserId',
                email: reqBody.email,
                password: 'hashedPassword',
                role: 'doctor',
                _doc: {}
            };

            Doctor.findOne.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('generatedToken');

            const response = await request(app).post('/auth/login').send(reqBody);

            expect(Doctor.findOne).toHaveBeenCalledWith({ email: reqBody.email });
            expect(bcrypt.compare).toHaveBeenCalledWith(reqBody.password, user.password);
            expect(jwt.sign).toHaveBeenCalledWith({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15d' });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.token).toBe('generatedToken');
        });

        it('should return 404 if the user is not found', async () => {
            const reqBody = {
                email: 'unknown@example.com',
                password: 'password123'
            };

            Doctor.findOne.mockResolvedValue(null);
            User.findOne.mockResolvedValue(null);
            Admin.findOne.mockResolvedValue(null);

            const response = await request(app).post('/auth/login').send(reqBody);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });

        it('should return 400 if the password is incorrect', async () => {
            const reqBody = {
                email: 'doctor@example.com',
                password: 'wrongpassword'
            };

            const user = {
                _id: 'someUserId',
                email: reqBody.email,
                password: 'hashedPassword',
                role: 'doctor'
            };

            Doctor.findOne.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(false);

            const response = await request(app).post('/auth/login').send(reqBody);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should return 500 if an error occurs during login', async () => {
            const reqBody = {
                email: 'doctor@example.com',
                password: 'password123'
            };

            Doctor.findOne.mockRejectedValue(new Error('Database error'));

            const response = await request(app).post('/auth/login').send(reqBody);

            expect(response.status).toBe(500);
            expect(response.body.status).toBe(false);
            expect(response.body.message).toBe('Failed to login');
        });
    });

    describe('getTokenById', () => {
        it('should generate and return a token by user ID', async () => {
            const reqBody = { id: 'someUserId' };

            const user = {
                _id: reqBody.id,
                role: 'admin',
                _doc: {}
            };

            Admin.findById.mockResolvedValue(user);
            jwt.sign.mockReturnValue('generatedToken');

            const response = await request(app).post('/auth/getTokenById').send(reqBody);

            expect(Admin.findById).toHaveBeenCalledWith(reqBody.id);
            expect(jwt.sign).toHaveBeenCalledWith({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15d' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBe('generatedToken');
        });

        it('should return 404 if the user is not found by ID', async () => {
            const reqBody = { id: 'unknownId' };

            Admin.findById.mockResolvedValue(null);
            User.findById.mockResolvedValue(null);
            Doctor.findById.mockResolvedValue(null);

            const response = await request(app).post('/auth/getTokenById').send(reqBody);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });

        it('should return 500 if an error occurs while generating the token by ID', async () => {
            const reqBody = { id: 'someUserId' };

            Admin.findById.mockRejectedValue(new Error('Database error'));

            const response = await request(app).post('/auth/getTokenById').send(reqBody);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error, Try again');
        });
    });
});
