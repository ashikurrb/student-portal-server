import userModel from '../models/userModel.js'
import { comparePassword, hashPassword } from '../helpers/authHelper.js'
import JWT from 'jsonwebtoken'

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

        // //find user by email
        // const existingUser = await userModel.findOne({ email })

        // //check existing user
        // if (existingUser) {
        //     return res.status(200).send({
        //         success: false,
        //         message: "Already Registered. Please Log In"
        //     })
        // }


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
                    message: "Email Already Registered."
                });
            } else if (existingUser.phone === phone) {
                return res.status(200).send({
                    success: false,
                    message: "Phone Number Already Exist."
                });
            }
        }

        //register User
        //encrypting password
        const hashedPassword = await hashPassword(password)

        //save
        const user = await new userModel({ name, email, phone, answer, password: hashedPassword, grade }).save()
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

        // Find user by email or phone
        const user = await userModel.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });

        //Login validation
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'No User Found. Please Register',
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

//test controller 
export const testController = (req, res) => {
    try {
        res.send('Protected Route');
    } catch (error) {
        console.log(error);
        res.send({ error })
    }
}