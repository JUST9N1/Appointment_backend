const express = require('express');
const router = express.Router();

const { getSingleUser, getAllUser, updateUser, deleteUser, getUserProfile, getMyAppointments } = require('../controllers/userControllers.js');
const { authenticate, restrict } = require('../auth/verifyToken.js');

// Define your routes using the destructured functions
router.get('/:id', authenticate, restrict(["patient"]), getSingleUser);
router.get('/',authenticate, restrict(['admin']) ,getAllUser);
router.put('/:id', authenticate, restrict(["patient"]), updateUser);
router.delete('/:id',authenticate, restrict(["patient"]), deleteUser);
router.get('/profile/me',authenticate, restrict(["patient"]), getUserProfile);
router.get('/appointments/my-appointments',authenticate, restrict(["patient"]), getMyAppointments);


module.exports = router;

// authenticate, restrict(["admin"]),