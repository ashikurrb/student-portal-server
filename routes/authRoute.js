import express from "express"
import formidable from "express-formidable";
import { deleteUserController, forgotPasswordController, getAllUsersController, getProfileDataController, loginController, registerController, updateUserGradeController, updateUserProfileController } from "../controller/authController.js"
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js'

//router object
const router = express.Router();

//routing

//REGISTER || Method: POST
router.post('/register', registerController)

//Login || Method: POST
router.post('/login', loginController)

//Forgot Password || Method: POST
router.post('/forgot-password', forgotPasswordController)

//all user list
router.get("/all-users", requireSignIn, isAdmin, getAllUsersController)

//get logged-in user profile data
router.get("/profile", requireSignIn, getProfileDataController)

//Update User Grade by Admin || Method: POST
router.put('/user-grade/:id', requireSignIn, isAdmin, formidable(), updateUserGradeController)

//update user profile
router.put('/update-profile', requireSignIn, updateUserProfileController)

//delete user by admin
router.delete('/delete-user/:id', requireSignIn, isAdmin, deleteUserController)

//protected user route
router.get('/user-auth', requireSignIn, (req, res) => {
    res.status(200).send({ ok: true })
})

//protected admin route
router.get('/admin-auth', requireSignIn, isAdmin, (req, res) => {
    res.status(200).send({ ok: true })
})

export default router;