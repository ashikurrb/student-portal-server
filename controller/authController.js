import userModel from '../models/userModel.js'
import paymentModel from '../models/paymentModel.js';
import resultModel from '../models/resultModel.js';
import { comparePassword, hashPassword } from '../helpers/authHelper.js'
import JWT from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { CourierClient } from '@trycourier/courier';

dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//courier mail token
const courier = new CourierClient({ authorizationToken: process.env.COURIER_AUTH_TOKEN });

export const registerController = async (req, res) => {
    try {
        const { name, email, password, phone, answer, grade } = req.fields;
        //validation
        if (!name) {
            return res.send({ message: "Name is required" })
        }
        if (!email) {
            return res.send({ message: "Email is required" })
        }
        if (!phone) {
            return res.send({ message: "Phone number is required" })
        }
        if (!password) {
            return res.send({ message: "Password is required" })
        }
        if (!answer) {
            return res.send({ message: "Answer is required" })
        }
        if (!grade) {
            return res.send({ message: "Grade is required" })
        }

        // Find user by email or phone
        const existingUser = await userModel.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });

        // Check existing user
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(200).send({
                    success: false,
                    message: "Email is already registered"
                });
            } else if (existingUser.phone === phone) {
                return res.status(200).send({
                    success: false,
                    message: "Phone number already exists"
                });
            }
        }

        //register User
        //condition 
        if (phone && phone.length < 11) {
            return res.json({ message: "Mobile number must be 11 digits" })
        }
        if (password && password.length < 6) {
            return res.json({ message: "Password must be at least 6 characters long" })
        }
        //encrypting password
        const hashedPassword = password ? await hashPassword(password) : undefined;

        //save
        const user = await new userModel({ name, email, phone, answer, password: hashedPassword, grade }).save()

        // Send registration confirmation email via Courier
        const { requestId } = await courier.send({
            message: {
                to: {
                    data: { name },
                    email
                },
                template: "757R9DGS774B6KHWBG7TZ2MM8EX8",
                data: {
                    name: "name",
                },
                routing: {
                    method: "single",
                    channels: ["email"],
                },
            },
        });
        
        res.status(201).send({
            success: true,
            message: "Registration successful! Please login",
            user
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error during registration",
            error
        })
    }
}

//Login : POST
export const loginController = async (req, res) => {
    try {
        const { email, password, phone } = req.fields;

        //validation
        if (!email && !phone || !password) {
            return res.status(404).send({
                success: false,
                message: "Invalid credential",
                error
            })
        }

        // Find user by email or phone and populate grade
        const user = await userModel.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        }).populate('grade');

        //Login validation
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No user found',
            })
        }

        //compare password encryption
        const match = await comparePassword(password, user.password)
        if (!match) {
            return res.status(200).send({
                success: false,
                message: "Invalid password",
            })
        }

        //token
        const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d", });
        res.status(200).send({
            success: true,
            message: "Login Successful",
            user: {
                avatar: user.avatar,
                name: user.name,
                email: user.email,
                phone: user.phone,
                grade: user.grade,
                role: user.role,
            }, token,
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error during Login",
            error
        })
    }
}

//forgot password controller 
export const forgotPasswordController = async (req, res) => {
    try {
        const { email, answer, newPassword } = req.fields;

        // Input validation
        if (!email) {
            return res.status(400).send({ success: false, message: "Email is required" });
        }
        if (!answer) {
            return res.status(400).send({ success: false, message: "Answer is required" });
        }
        if (!newPassword) {
            return res.status(400).send({ success: false, message: "New password is required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).send({ success: false, message: "Password must be at least 6 characters long" });
        }

        // Check user existence
        const user = await userModel.findOne({ email, answer });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "Invalid email or answer"
            });
        }

        // Encrypting the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user's password
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.status(200).send({
            success: true,
            message: "Password reset successful!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error resetting password",
            error: error.message || "Internal Server Error"
        });
    }
}


//get logged-in user profile
export const getProfileDataController = async (req, res) => {
    try {
        // Extract token from request headers
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied, no token provided",
            });
        }
        // Verify token
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        // Fetch user data from the database
        const user = await userModel.findById(decoded._id).populate('grade').select('-password');
        // Send user profile data as response
        res.json({
            message: "Profile data fetched successfully",
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error fetching profile data",
            error,
        });
    }
};

//Get all users list controller
export const getAllUsersController = async (req, res) => {
    try {
        const users = await userModel
            .find({})
            .populate("grade")
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching all users",
            error,
        });
    }
};

//update user's grade controller
export const updateUserGradeController = async (req, res) => {
    try {
        const { grade } = req.fields;
        if (!grade) {
            return res.status(400).send({ message: "New Grade is Required" });
        }
        const updatedUserGrade = await userModel.findByIdAndUpdate(req.params.id, { ...req.fields }, { new: true })
        res.status(201).send({
            success: true,
            message: "Users grade updated successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating users grade",
            error
        })
    }
}

//update user profile
export const updateUserProfileController = async (req, res) => {
    try {
        const { avatar, name, phone, oldPassword, newPassword, answer } = req.fields;
        const file = req.files.photo;

        // Find the user by ID
        const userId = req.user._id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Check if the phone number already exists for another user
        if (phone) {
            const existingUser = await userModel.findOne({ phone });
            if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
                return res.status(400).json({ error: "Phone number already exists" });
            }
        }

        // Check if oldPassword is provided when updating profile details or password
        if ((name || phone || avatar || answer) && !oldPassword) {
            return res.status(400).json({ error: "Password is required to update profile" });
        }

        if (newPassword && newPassword.length < 6) {
            return res.json({ error: "Password must be at least 6 characters long" });
        }

        if (newPassword || oldPassword) {
            if (!oldPassword) {
                return res.status(400).json({ error: "Password is required to set a new password" });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Incorrect password" });
            }
        }

        // Conditional photo upload
        if (file) {
            // If the user has an old avatar, delete it first
            if (user.avatar) {
                const publicId = user.avatar.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`5points-student-portal/avatar/${publicId}`);
            }

            try {
                // Photo Upload to Cloudinary
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: '5points-student-portal/avatar',
                });
                // Update the user's photo URL in the database
                user.avatar = result.secure_url;

            } catch (uploadError) {
                console.error('Cloudinary Upload Error:', uploadError);
                return res.status(500).send({ message: 'Upload failed', error: uploadError.message });
            }
        }

        const hashedPassword = newPassword ? await hashPassword(newPassword) : user.password;
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id, {
            name: name || user.name,
            phone: phone || user.phone,
            answer: answer || user.answer,
            avatar: user.avatar,
            password: hashedPassword
        }, { new: true }).populate("grade");

        res.status(200).send({
            success: true,
            message: 'Profile updated successfully',
            updatedUser
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating profile",
            error
        });
    }
};

//delete user controller
export const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userModel.findById(id);

        // Extract public_id from the Cloudinary URL
        const avatarUrl = user.avatar;
        const publicId = avatarUrl
            ? '5points-student-portal/avatar/' + avatarUrl.split('/').pop().split('.')[0]
            : null;

        await Promise.all([
            userModel.findByIdAndDelete(id),
            paymentModel.deleteMany({ user: id }),
            resultModel.deleteMany({ user: id }),
            publicId ? cloudinary.uploader.destroy(publicId) : null,
        ]);
        res.status(200).send({
            success: true,
            message: "User and their data have been deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while deleting user"
        })
    }
}