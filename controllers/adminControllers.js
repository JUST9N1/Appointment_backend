const Admin = require('../models/AdminSchema.js');
const bcrypt = require('bcrypt');


exports.updateAdmin = async (req, res) => {
    const id = req.params.id;
    const { password, ...restBody } = req.body; // Destructure password from req.body

    try {
        // Hash the password if present in the request body
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            restBody.password = hashedPassword;
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            id,
            { $set: restBody },
            { new: true, runValidators: true }
        );

        if (!updatedAdmin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin
        });

    } catch (err) {
        console.error("Error updating Admin:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update",
            error: err.message
        });
    }
};

exports.getAdminProfile = async (req, res) => {
    const adminId = req.userId

    try {
        const admin = await Admin.findById(adminId)

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
        
        const { password, ...rest} = admin._doc

        res.status(200).json({
            success: true,
            message: "Admin profile fetched successfully",
            data: {...rest}
        });
    
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin profile",
            error: error.message
        });
    }
}