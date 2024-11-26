const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Doctor = require('../models/DoctorSchema');
const Admin = require('../models/AdminSchema');

exports.authenticate = async (req, res, next) => {
    const authToken = req.headers.authorization;

    if (!authToken || !authToken.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "Access denied! Unauthorized user"
        });
    }

    try {
        const token = authToken.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.id;
        req.role = decoded.role;


        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Session expired! Please login again"
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

exports.restrict = roles => async (req, res, next) => {
    const userId = req.userId;

    try {
        let user = await User.findById(userId) || await Doctor.findById(userId) || await Admin.findById(userId);

        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied! You do not have permission"
            });
        }

        next();
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server error while verifying user role",
            error: err.message
        });
    }
};
