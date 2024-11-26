const Booking = require('../models/BookingSchema');
const Doctor = require('../models/DoctorSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

exports.updateDoctor = async (req, res) => {
    const id = req.params.id;
    const { password, ...restBody } = req.body; // Destructure password from req.body

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid doctor ID"
        });
    }

    // Clone req.body and remove the email field
    const updateData = { ...req.body };
    delete updateData.email;
    

    try {

        // Hash the password if present in the request body
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Doctor updated successfully",
            data: updatedDoctor
        });

    } catch (err) {
        console.error("Error updating doctor:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update doctor",
            error: err.message
        });
    }
};

exports.deleteDoctor = async (req, res) => {
    const id = req.params.id;

    try {
        const deletedDoctor = await Doctor.findByIdAndDelete(id);

        if (!deletedDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Doctor deleted successfully"
        });

    } catch (err) {
        console.error("Error deleting doctor:", err);
        res.status(500).json({
            success: false,
            message: "Failed to delete",
            error: err.message
        });
    }
};

exports.getSingleDoctor = async (req, res) => {
    const id = req.params.id;

    try {
        const doctor = await Doctor.findById(id)
        .populate('reviews')
        .select('-password');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Doctor found",
            data: doctor
        });

    } catch (err) {
        console.error("Error finding doctor:", err);
        res.status(500).json({
            success: false,
            message: "No doctor found",
            error: err.message
        });
    }
};

exports.getAllDoctor = async (req, res) => {
    try {

        const { query } = req.query;
        let doctors;

        if (query) {
            doctors = await Doctor.find({
                isApproved: "approved",
                $or: [{ name: { $regex: query, $options: 'i' }},
                    { specialization: { $regex: query, $options: 'i' }}, 
                ]
            }).select('-password');
        }else{
            doctors = await Doctor.find().select('-password');
        }


        res.status(200).json({
            success: true,
            message: "Doctors found",
            data: doctors
        });

    } catch (err) {
        console.error("Error finding doctors:", err);
        res.status(500).json({
            success: false,
            message: "Not found",
            error: err.message
        });
    }
};


exports.getDoctorProfile = async (req, res) => {
    const doctorId = req.userId

    try {
        const doctor = await Doctor.findById(doctorId)

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }
        
        const { password, ...rest} = doctor._doc;
        const appointments = await Booking.find({doctor: doctorId})

        res.status(200).json({
            success: true,
            message: "Doctor profile fetched successfully",
            data: {...rest, appointments}
        });
    
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch doctor profile",
            error: error.message
        });
    }
}


exports.approveDoctor = async (req, res) => {
    const id = req.params.id;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid doctor ID"
        });
    }

    try {
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            id,
            { $set: { isApproved: "approved" } },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Doctor approved successfully",
            data: updatedDoctor
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to approve doctor",
            error: err.message
        });
    }
};