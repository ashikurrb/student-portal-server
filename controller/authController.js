import userModel from '../models/userModel.js'
import paymentModel from '../models/paymentModel.js';
import resultModel from '../models/resultModel.js';
import { comparePassword, hashPassword } from '../helpers/authHelper.js'
import JWT from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const registerController = async (req, res) => {
    try {
        const { name, email, password, phone, answer, grade } = req.body;
        //validation
        if (!name) {
            return res.send({ message: "Name is Required" })
        }
        if (!email) {
            return res.send({ message: "Email is Required" })
        }
        if (!phone) {
            return res.send({ message: "Phone Number is Required" })
        }
        if (!password) {
            return res.send({ message: "Password is Required" })
        }
        if (!answer) {
            return res.send({ message: "Answer  is Required" })
        }
        if (!grade) {
            return res.send({ message: "Grade  is Required" })
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
                    message: "Phone number is already exist"
                });
            }
        }

        //register User
        //condition 
        if (phone && phone.length < 11) {
            return res.json({ message: "Mobile number must be 11 digit" })
        }
        if (password && password.length < 6) {
            return res.json({ message: "Password must be 6 digit" })
        }
        //encrypting password
        const hashedPassword = password ? await hashPassword(password) : undefined;

        //save
        const user = await new userModel({ name, email, phone, answer, password: hashedPassword, grade }).save()
        //password validation
        res.status(201).send({
            success: true,
            message: "Registration successful! Please login",
            user
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while registration",
            error
        })
    }
}

//Login : POST
export const loginController = async (req, res) => {
    try {
        const { email, password, phone } = req.body;

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
            return res.status(404).send({
                success: false,
                message: 'No user found. Please register',
            })
        }

        //compare password encryption
        const match = await comparePassword(password, user.password)
        if (!match) {
            return res.status(200).send({
                success: false,
                message: "Invalid Password",
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
            message: "Error in Login",
            error
        })
    }
}

//forgot password controller 
export const forgotPasswordController = async (req, res) => {
    try {
        const { email, answer, newPassword } = req.body;
        if (!email) {
            res.status(400).send({ message: "Email is Required" })
        }
        if (!answer) {
            res.status(400).send({ message: "Answer is Required" })
        }
        if (!newPassword) {
            res.status(400).send({ message: "New Password is Required" })
        }
        //check
        const user = await userModel.findOne({ email, answer })
        //validation
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "Email or answer are not matched",
                error
            })
        }

        //condition 
        if (newPassword && newPassword.length < 6) {
            return res.json({ message: "Password must be 6 digit" })
        }
        //encrypting password
        const hashed = newPassword ? await hashPassword(newPassword) : undefined;

        await userModel.findByIdAndUpdate(user._id, { password: hashed })
        res.status(200).send({
            success: true,
            message: "Password reset successful!"
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in Forgot password",
            error
        })
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
        const { avatar, name, phone, oldPassword, newPassword, answer } = req.body;
        const user = await userModel.findById(req.user._id);

        if (!name) {
            return res.send({ message: "Name is Required" });
        }
        if (!phone) {
            return res.send({ message: "Phone Number is Required" });
        }
        if (newPassword && newPassword.length < 6) {
            return res.json({ error: "Password must be 6 digits" });
        }
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ error: "Old password is required to set a new password" });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Old password is incorrect" });
            }
        }

        const hashedPassword = newPassword ? await hashPassword(newPassword) : user.password;

        const updatedUser = await userModel.findByIdAndUpdate(req.user._id, {
            name: name || user.name,
            phone: phone || user.phone,
            answer: answer || user.answer,
            avatar: avatar || user.avatar,
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


//upload/update user photo with cloudinary
export const uploadUserAvatarController = async (req, res) => {
    console.log('Request Files:', req.files);
    const file = req.files.photo;
    if (!file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    try {

        //find the user by id first
        const userId = req.user._id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        //if user have old avatar, delete it first
        if (user.avatar) {
            const publicId = user.avatar.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`5points-student-portal/avatar/${publicId}`);
        }

        // Photo Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: '5points-student-portal/avatar' // Specify the folder here
        });
        console.log('Cloudinary Upload Result:', result); // Log result for debugging

        // Update the user's photo URL in the database
        user.avatar = result.secure_url;
        await user.save();

        return res.status(200).send({
            message: 'Photo uploaded and user updated successfully',
            url: result.secure_url,
        });
    } catch (error) {
        console.error('Cloudinary Upload Error:', error); // Log error details
        return res.status(500).send({ message: 'Upload to Cloudinary failed', error });
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
            message: "User & their data deleted successfully",
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