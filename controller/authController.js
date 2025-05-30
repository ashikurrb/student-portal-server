import userModel from '../models/userModel.js'
import gradeModel from '../models/gradeModel.js';
import courseModel from '../models/courseModel.js';
import paymentModel from '../models/paymentModel.js';
import resultModel from '../models/resultModel.js';
import orderModel from '../models/orderModel.js';
import otpModel from '../models/otpModel.js';
import { comparePassword, hashPassword } from '../helpers/authHelper.js'
import JWT from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { CourierClient } from '@trycourier/courier';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc)
dayjs.extend(timezone)

dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//courier mail token
const courier = new CourierClient({ authorizationToken: process.env.COURIER_AUTH_TOKEN });

//send otp
export const getOtpController = async (req, res) => {
    try {
        const { name, email } = req.fields;
        //validation
        if (!name) {
            return res.send({ message: "Name is required" })
        }
        if (!email) {
            return res.send({ message: "Email is required" })
        }

        // Find user by email or phone
        const existingUser = await userModel.findOne({ email: email });

        // Check existing user
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(200).send({
                    success: false,
                    message: "Email is already registered"
                });
            }
        }

        // Check if there's an unexpired OTP for this email
        const existingOtp = await otpModel.findOne({
            email,
            expiresAt: { $gt: Date.now() },
        });

        if (existingOtp) {
            return res.status(200).send({
                success: true,
                message: "OTP already sent. Use it or try again later.",
            });
        }

        // Generate OTP and save it temporarily
        const otp = crypto.randomInt(100000, 999999).toString();
        await new otpModel({ name, email, otp, type: "registration", expiresAt: Date.now() + 5 * 60 * 1000 }).save();

        // Send OTP via Courier email
        const { requestId } = await courier.send({
            message: {
                to: {
                    email: email
                },
                template: process.env.COURIER_OTP_TEMPLATE_KEY,
                data: {
                    name: name,
                    otp: otp,
                },
                routing: {
                    method: "single",
                    channels: ["email"],
                },
            },
        });

        res.status(200).send({
            success: true,
            message: "OTP sent to your email",
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error during registration",
            error
        })
    }
}

//verify otp and register
export const registerController = async (req, res) => {
    try {
        const { email, otp, password, name, phone, answer, grade } = req.fields;

        // Find if email exists in the database
        const otpEmail = await otpModel.findOne({ email });
        if (!otpEmail) {
            return res.status(400).send({ success: false, message: "Email not found" });
        }

        // Check if OTP matches for the provided email
        const otpRecord = await otpModel.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).send({ success: false, message: "Invalid OTP" });
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < Date.now()) {
            return res.status(400).send({ success: false, message: "OTP expired" });
        }

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

        //condition 
        if (phone && phone.length < 11) {
            return res.json({ message: "Mobile number must be 11 digits" })
        }
        if (password && password.length < 6) {
            return res.json({ message: "Password must be 6 characters or more" })
        }
        //encrypting password
        const hashedPassword = password ? await hashPassword(password) : undefined;

        // Save user in the database
        const user = await new userModel({ name, email, phone, answer, password: hashedPassword, grade }).save();

        // Send confirmation email
        await courier.send({
            message: {
                to: { email },
                template: process.env.COURIER_WELCOME_TEMPLATE_KEY,
                data: { name },
                routing: { method: "single", channels: ["email"] },
            },
        });

        // Delete OTP record after successful registration
        await otpModel.deleteOne({ email, otp });

        res.status(201).send({
            success: true,
            message: "Registration successful!",
            user,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error during OTP verification", error });
    }
};

//Login : POST
export const loginController = async (req, res) => {
    try {
        const { email, password, phone } = req.fields;

        //validation
        if (!email && !phone || !password) {
            return res.status(404).send({
                success: false,
                message: "Invalid Credential",
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
                error: 'Invalid Credential',
            })
        }
        //user status validation
        if (user.status === "Disabled") {
            return res.status(404).json({
                success: false,
                error: "Temporarily Blocked. Contact Admin",
            })
        }

        //compare password encryption
        const match = await comparePassword(password, user.password)
        if (!match) {
            return res.status(200).send({
                success: false,
                message: "Invalid Credential",
            })
        }

        //token
        const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
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
                answer: user.answer,
            }, token,
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Login error",
            error
        })
    }
}

export const getForgotPasswordOtpController = async (req, res) => {
    try {
        const { email } = req.fields;
        if (!email) {
            return res.send({ message: "Email is Required" })
        }

        // Find user by email or phone
        const existingUser = await userModel.findOne({ email: email });

        // Check if user exists
        if (!existingUser) {
            return res.status(200).send({
                success: false,
                message: "User Not Found. Please Register"
            });
        }

        //get user name
        const name = existingUser.name;

        // Check if there's an unexpired OTP for this email
        const existingOtp = await otpModel.findOne({
            email,
            expiresAt: { $gt: Date.now() },
        });

        if (existingOtp) {
            return res.status(200).send({
                success: true,
                message: "OTP already sent. Use it or try again later.",
            });
        }

        // Generate OTP and save it temporarily
        const otp = crypto.randomInt(100000, 999999).toString();
        await new otpModel({ email, name, otp, type: "password_reset", expiresAt: Date.now() + 5 * 60 * 1000 }).save();

        // Send OTP via Courier email
        const { requestId } = await courier.send({
            message: {
                to: {
                    email: email
                },
                template: process.env.COURIER_FORGOT_PASSWORD_OTP_TEMPLATE_KEY,
                data: {
                    name: name,
                    otp: otp,
                },
                routing: {
                    method: "single",
                    channels: ["email"],
                },
            },
        });

        res.status(200).send({
            success: true,
            message: "OTP sent to your email",
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error getting OTP",
            error
        })
    }
}

//forgot password controller 
export const forgotPasswordController = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.fields;

        // Find if email exists in the database
        const otpEmail = await otpModel.findOne({ email });
        if (!otpEmail) {
            return res.status(400).send({ success: false, message: "Email not found" });
        }

        // Check if OTP matches for the provided email
        const otpRecord = await otpModel.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).send({ success: false, message: "Invalid OTP" });
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < Date.now()) {
            return res.status(400).send({ success: false, message: "OTP expired" });
        }

        // Input validation
        if (!email) {
            return res.status(400).send({ success: false, message: "Email is required" });
        }
        if (!newPassword) {
            return res.status(400).send({ success: false, message: "New password is required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).send({ success: false, message: "Password must be 6 characters or more" });
        }

        // Check user existence
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User Not Found. Please Register"
            });
        }

        // Check if user status is disabled
        if (user.status === "Disabled") {
            return res.status(403).send({
                success: false,
                message: "Temporarily Blocked. Contact Admin"
            });
        }

        // Encrypting the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user's password
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.status(200).send({
            success: true,
            message: "Password reset successfully!"
        });

        // Delete OTP record after successful registration
        await otpModel.deleteOne({ email, otp });

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

//get failed user controller
export const getFailedUserController = async (req, res) => {
    try {
        //show only expired otp users
        // const expiredOtp = new Date(Date.now() - 5 * 60 * 1000);
        // const failedUser = await otpModel.find({ expiresAt: { $lt: expiredOtp } }).sort({ createdAt: -1 });
        const failedUser = await otpModel.find({ type: "registration" }).sort({ createdAt: -1 });
        res.json(failedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching failed users",
            error,
        });
    }
}

//delete failed users
export const deleteFailedUserController = async (req, res) => {
    try {
        const { id } = req.params;
        await otpModel.findByIdAndDelete(id);
        res.status(200).send({ message: "User deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error deleting failed user",
            error,
        });
    }
}

//Get all users list controller
export const getAllUsersController = async (req, res) => {
    try {
        const users = await userModel
            .find({})
            .select("-password")
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

//update user's status controller
export const updateUserStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userStatus = await userModel.findByIdAndUpdate(id, { status }, { new: true });

        // Conditional message based on status
        const message = status === 'Enabled'
            ? "User Approved"
            : "User Blocked";

        res.status(201).send({
            success: true,
            message,
            userStatus
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

        //user status validation
        if (user.status === "Disabled") {
            return res.status(404).json({
                success: false,
                error: "Temporarily Blocked. Contact Admin",
            })
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
            return res.json({ error: "Password must be 6 characters or more" });
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
        }, { new: true })
            .populate("grade")
            .select("-password");

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
        if (user.role === 1) {
            return res.status(403).send({
                success: false,
                message: "Authorization Error: Admin cannot be deleted",
            });
        }

        // Extract public_id from the Cloudinary URL
        const avatarUrl = user.avatar;
        const publicId = avatarUrl
            ? '5points-student-portal/avatar/' + avatarUrl.split('/').pop().split('.')[0]
            : null;

        await Promise.all([
            userModel.findByIdAndDelete(id),
            paymentModel.deleteMany({ user: id }),
            resultModel.deleteMany({ user: id }),
            orderModel.deleteMany({ buyer: id }),
            publicId ? cloudinary.uploader.destroy(publicId) : null,
        ]);
        res.status(200).send({
            success: true,
            message: "User and their data deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error deleting user"
        })
    }
}

//get dashboard data controller
export const getDashboardDataController = async (req, res) => {
    try {
        const totalUser = await userModel.countDocuments();
        const totalGrade = await gradeModel.countDocuments();
        const totalUserbyGrade = await userModel.aggregate([
            {
                $lookup: {
                    from: "grades",
                    localField: "grade",
                    foreignField: "_id",
                    as: "gradeDetails"
                }
            },
            {
                $unwind: "$gradeDetails"
            },
            {
                $group: {
                    _id: "$gradeDetails.name",
                    total: { $sum: 1 }
                }
            }
        ]);

        // total payment received
        const paymentTotal = await paymentModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);
        const totalPaymentReceived = paymentTotal.length > 0 ? paymentTotal[0].totalAmount : 0;

        //total payment of current month
        const currentDate = dayjs().tz('Asia/Dhaka');
        const firstDayOfMonth = currentDate.startOf('month').toDate(); // Start of the month
        const lastDayOfMonth = currentDate.endOf('month').toDate(); // End of the month

        const currentMonthPayment = await paymentModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: firstDayOfMonth, // Payments from the start of the current month
                        $lte: lastDayOfMonth  // Payments up to the end of the current month
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPayment: { $sum: "$amount" }
                }
            }
        ]);

        const totalCurrentMonthPayment = currentMonthPayment.length > 0 ? currentMonthPayment[0].totalPayment : 0;
        const currentMonth = dayjs().tz('Asia/Dhaka').format('MMMM');

        //total course
        const totalCourse = await courseModel.countDocuments();

        //total order
        const totalOrder = await orderModel.countDocuments();
        const totalApprovedOrder = await orderModel.countDocuments({ status: "Approved" });
        const totalPendingOrder = await orderModel.countDocuments({ status: "Pending" });
        const totalCanceledOrder = await orderModel.countDocuments({ status: "Canceled" });
        const totalOrderSoldAmount = await orderModel.aggregate([
            {
                $match: {
                    status: "Approved" // Only include orders with status 'approved'
                }
            },
            {
                $lookup: {
                    from: "courses", // The name of the collection storing course details
                    localField: "course", // Field in `orderModel` referencing the course ID
                    foreignField: "_id", // Field in `courseModel` containing the ObjectId
                    as: "courses" // Output array field with matching course documents
                }
            },
            {
                $unwind: "$courses" // Flatten the array to access course details
            },
            {
                $group: {
                    _id: null, // No grouping key needed, sum all prices
                    totalCoursePrice: { $sum: "$courses.price" } // Sum the `price` field from course details
                }
            }
        ]);

        const totalOrderSell = totalOrderSoldAmount.length > 0 ? totalOrderSoldAmount[0].totalCoursePrice : 0;

        res.json({
            totalUser,
            totalGrade,
            totalCourse,
            totalPaymentReceived,
            totalOrder,
            totalApprovedOrder,
            totalPendingOrder,
            totalCanceledOrder,
            totalUserbyGrade,
            currentMonth,
            totalCurrentMonthPayment,
            totalOrderSell,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error fetching dashboard data"
        });
    }
};