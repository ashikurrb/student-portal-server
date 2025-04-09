import express from "express"
import formidable from "express-formidable";
import { deleteUserController, forgotPasswordController, getAllUsersController, getProfileDataController, loginController, registerController, getOtpController, updateUserGradeController, updateUserProfileController, getFailedUserController, deleteFailedUserController, updateUserStatusController, getDashboardDataController,getForgotPasswordOtpController } from "../controller/authController.js"
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js'

//router object
const router = express.Router();

//routing

//OTP Verification
router.post('/verify-otp', formidable(), getOtpController)

//REGISTER 
router.post('/register', formidable(), registerController);

//get all failed user
router.get('/failed-user', requireSignIn, isAdmin, getFailedUserController)

//delete failed user
router.delete('/delete-failed/:id', requireSignIn, isAdmin, deleteFailedUserController)

//Login
router.post('/login', formidable(), loginController)

//Verify Forgot Password OTP 
router.post('/verify-forgot-password', formidable(), getForgotPasswordOtpController)

//Forgot Password 
router.post('/forgot-password', formidable(), forgotPasswordController)

//all user list
router.get("/all-users", requireSignIn, isAdmin, getAllUsersController)

//get logged-in user profile data
router.get("/profile", requireSignIn, getProfileDataController)

//Update User Grade by Admin
router.put('/user-grade/:id', requireSignIn, isAdmin, formidable(), updateUserGradeController)

//Update User Status by Admin
router.put('/user-status/:id', requireSignIn, isAdmin, updateUserStatusController)

//update user profile
router.put('/update-profile', requireSignIn, formidable(), updateUserProfileController)

//delete user by admin
router.delete('/delete-user/:id', requireSignIn, isAdmin, deleteUserController)

//all user list
router.get("/dashboard-data", requireSignIn, isAdmin, getDashboardDataController)

//protected user route
router.get('/user-auth', requireSignIn, (req, res) => {
    res.status(200).send({ ok: true })
})

//protected admin route
router.get('/admin-auth', requireSignIn, isAdmin, (req, res) => {
    res.status(200).send({ ok: true })
})

export default router;