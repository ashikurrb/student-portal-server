import userModel from '../models/userModel.js'
import { comparePassword, hashPassword } from '../helpers/authHelper.js'
import JWT from 'jsonwebtoken'
import paymentModel from '../models/paymentModel.js';
import resultModel from '../models/resultModel.js';

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
                    message: "Phone Number is already exist"
                });
            }
        }

        //register User
        //condition 
        if (phone && phone.length < 11) {
            return res.json({ message: "Mobile Number must be 11 digit" })
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
            message: "Registration Successful",
            user
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while Registration",
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
                message: 'No user found. Please Register',
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
                message: "Email or Answer not matched",
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
            message: "Password changed successfully"
        })

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in forgot password",
            error
        })
    }
}

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
            message: "User's grade updated successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating user's grade",
            error
        })
    }
}

//update user profile
export const updateUserProfileController = async (req, res) => {
    try {
        const { name, phone, password, answer } = req.body;
        const user = await userModel.findById(req.user._id);
        if (!name) {
            return res.send({ message: "Name is Required" })
        }
        if (!phone) {
            return res.send({ message: "Phone Number is Required" })
        }
        if (!password) {
            return res.send({ message: "Password is Required" })
        }
        if (password && password.length < 6) {
            return res.json({ error: "Password must be 6 digit" })
        }
        const hashedPassword = password ? await hashPassword(password) : undefined;
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id, {
            name: name || user.name,
            phone: phone || user.phone,
            answer: answer || user.answer,
            password: hashedPassword || user.password
        }, { new: true });
        res.status(200).send({
            success: true,
            message: 'Profile Updated Successfully',
            updatedUser
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating profile",
            error
        })
    }
}

//delete user controller
export const deleteUserController = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        await Promise.all([
            userModel.findByIdAndDelete(id),
            paymentModel.deleteMany({ user: id }),
            resultModel.deleteMany({ user: id })
        ]);
        res.status(200).send({
            success: true,
            message: "User & Data Deleted Successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while Deleting User"
        })
    }
}