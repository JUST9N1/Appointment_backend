const User = require('../models/userModel');
const Booking = require('../models/BookingSchema');
const Doctor = require('../models/DoctorSchema');
const bcrypt = require('bcrypt');

exports.updateUser = async (req, res) => {
    const id = req.params.id;
    const { password, ...restBody } = req.body; // Destructure password from req.body

    try {
        // Hash the password if present in the request body
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            restBody.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: restBody },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        });

    } catch (err) {
        console.error("Error updating User:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update",
            error: err.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    const id = req.params.id;

    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (err) {
        console.error("Error deleting User:", err);
        res.status(500).json({
            success: false,
            message: "Failed to delete",
            error: err.message
        });
    }
};

exports.getSingleUser = async (req, res) => {
    const id = req.params.id;

    try {
        const user = await User.findById(id).select('-password');

        if (!User) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User found",
            data: user
        });

    } catch (err) {
        console.error("Error finding User:", err);
        res.status(500).json({
            success: false,
            message: "No user found",
            error: err.message
        });
    }
};

exports.getAllUser = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');

        res.status(200).json({
            success: true,
            message: "Users found",
            data: users
        });

    } catch (err) {
        console.error("Error finding Users:", err);
        res.status(500).json({
            success: false,
            message: "Not found",
            error: err.message
        });
    }
};

exports.getUserProfile = async (req, res) => {
    const userId = req.userId

    try {
        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        const { password, ...rest} = user._doc

        res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: {...rest}
        });
    
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile",
            error: error.message
        });
    }
}

exports.getMyAppointments = async(req, res) => {
    try {

        // step 1: retrieve appointments from bookings for specific user
        const booking = await Booking.find({user: req.userId});

        // step 2: extract doctor ids from appointment bookings
        const doctorIds = booking.map(el => el.doctor.id)

        // step 3: retrieve doctors using doctor ids
        const doctors = await Doctor.find({_id: {$in: doctorIds}}).select('-password')

        res.status(200).json({
            success: true,
            message: "Appointments fetched successfully",
            data: doctors
        })

    } catch (error) {
        
        res.status(500).json({
            success: false,
            message: "Failed to fetch appointments",
            error: error.message
        })
    }
}