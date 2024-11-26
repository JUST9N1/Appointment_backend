const express = require('express');
const router = express.Router();

const {
    getSingleDoctor,
    getAllDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctorProfile,
    approveDoctor
} = require('../controllers/doctorController.js');

const { authenticate, restrict } = require('../auth/verifyToken.js');
const reviewRouter = require('./review.js');

// nested route
router.use('/:doctorId/reviews', reviewRouter);

// Define your routes using the destructured functions
router.get('/:id', getSingleDoctor);
router.get('/', getAllDoctor);
router.put('/:id', authenticate,restrict(["doctor", "admin"]), updateDoctor);
router.put('/:id', restrict(["admin", "doctor"]), updateDoctor);
router.delete('/:id', authenticate, restrict(["doctor"]), deleteDoctor);

router.get('/profile/me', authenticate, restrict(["doctor"]), getDoctorProfile);


// Admin-only route to approve doctors
router.patch('/approve-doctor/:id', authenticate, restrict(["admin"]), approveDoctor);

module.exports = router;
