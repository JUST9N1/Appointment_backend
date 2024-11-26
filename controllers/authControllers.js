const User = require('../models/userModel')
const Doctor = require('../models/DoctorSchema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const createError = require('../utils/appError')
const Admin = require('../models/AdminSchema')


// Generate JWT token
const generateToken = user => {
    return jwt.sign({ id: user._id, role: user.role },
        process.env.JWT_SECRET,
        {
            expiresIn: '15d'
        })
}


// Register User
exports.signup = async (req, res) => {

    const { email, password, name, role, photo, gender, phone } = req.body;

    try {

        let user = null;

        if (role === 'patient') {
            user = await User.findOne({ email })
        }
        else if (role === 'doctor') {
            user = await Doctor.findOne({ email })
        }
        else if (role === 'admin') {
            user = await User.findOne({ email })
        }


        // check if user already exists
        if (user) {
            return res.status(400).json({ message: 'User already exists' })
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (role === 'patient') {
            user = new User({
                name,
                email,
                password: hashedPassword,
                photo,
                gender,
                role,
                phone,
            });
        }


        if (role === 'doctor') {
            user = new Doctor({
                name,
                email,
                password: hashedPassword,
                photo,
                gender,
                role,
            });
        }

        if (role === 'admin') {
            user = new Admin({
                name,
                email,
                password: hashedPassword,
                photo,
                gender,
                role,
            });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User registered successfully',
        })


    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Internal server error, Try again',
        });
    }
}

// LOGGING USER
exports.login = async (req, res) => {
    const { email } = req.body;
    try {

        let user = null;

        const patient = await User.findOne({ email });
        const doctor = await Doctor.findOne({ email });
        const admin = await Admin.findOne({ email });

        if (patient) {
            user = patient;
        }
        if (doctor) {
            user = doctor;
        }
        if (admin) {
            user = admin;
        }

        // check if user exits or not
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // compare password
        const isPasswordMatch = await bcrypt.compare(
            req.body.password,
            user.password);

        if (!isPasswordMatch) {
            return res.status(400).json({
                status: false,
                message: 'Invalid credentials'
            });
        }

        // get token
        const token = generateToken(user);

        const { password, role, appointments, ...rest } = user._doc;

        res
            .status(200)
            .json({ status: true, message: 'logged in successful', token, data: { ...rest }, role, });


    } catch (error) {
        res.status(500).json({ status: false, message: 'Failed to login' });

    }

};


// Get Token by User ID
exports.getTokenById = async (req, res) => {
    const { id } = req.body;

    try {
        let user = null;

        const patient = await User.findById(id);
        const doctor = await Doctor.findById(id);
        const admin = await Admin.findById(id);

        if (patient) {
            user = patient;
        }
        if (doctor) {
            user = doctor;
        }
        if (admin) {
            user = admin;
        }

        // check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // generate token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            token,
            message: 'Token generated successfully',
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error, Try again',
        });
    }
};
