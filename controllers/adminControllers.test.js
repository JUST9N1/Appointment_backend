const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require('../models/AdminSchema.js');
const { updateAdmin, getAdminProfile } = require('../controllers/adminControllers.js');

// Mock the Admin model
jest.mock('../models/AdminSchema.js');

// Mock bcrypt
jest.mock('bcrypt');

const app = express();
app.use(express.json());

app.put('/admin/:id', updateAdmin);
app.get('/admin/profile', getAdminProfile);

describe('Admin Controller', () => {
    describe('updateAdmin', () => {
        it('should update the admin successfully with hashed password', async () => {
            const adminId = 'someAdminId';
            const reqBody = { password: 'newpassword', name: 'New Name' };
            const hashedPassword = 'hashedpassword';

            bcrypt.hash.mockResolvedValue(hashedPassword);
            Admin.findByIdAndUpdate.mockResolvedValue({ ...reqBody, _id: adminId, password: hashedPassword });

            const response = await request(app).put(`/admin/${adminId}`).send(reqBody);

            expect(bcrypt.hash).toHaveBeenCalledWith(reqBody.password, 10);
            expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
                adminId,
                { $set: { ...reqBody, password: hashedPassword } },
                { new: true, runValidators: true }
            );
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('New Name');
        });

        it('should return 404 if the admin is not found', async () => {
            const adminId = 'someAdminId';
            const reqBody = { name: 'New Name' };

            Admin.findByIdAndUpdate.mockResolvedValue(null);

            const response = await request(app).put(`/admin/${adminId}`).send(reqBody);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Admin not found');
        });

        it('should return 500 if an error occurs', async () => {
            const adminId = 'someAdminId';
            const reqBody = { name: 'New Name' };

            Admin.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

            const response = await request(app).put(`/admin/${adminId}`).send(reqBody);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to update');
        });
    });

    describe('getAdminProfile', () => {
        it('should return the admin profile successfully', async () => {
            const adminId = 'someAdminId';
            const adminData = { _id: adminId, name: 'Admin Name', password: 'hashedpassword' };

            Admin.findById.mockResolvedValue(adminData);

            const response = await request(app).get('/admin/profile').set('userId', adminId);

            expect(Admin.findById).toHaveBeenCalledWith(adminId);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Admin Name');
            expect(response.body.data.password).toBeUndefined();
        });

        it('should return 404 if the admin is not found', async () => {
            const adminId = 'someAdminId';

            Admin.findById.mockResolvedValue(null);

            const response = await request(app).get('/admin/profile').set('userId', adminId);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Admin not found');
        });

        it('should return 500 if an error occurs', async () => {
            const adminId = 'someAdminId';

            Admin.findById.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get('/admin/profile').set('userId', adminId);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to fetch admin profile');
        });
    });
});
