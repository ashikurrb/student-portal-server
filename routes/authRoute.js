import express from "express"
import { deleteUserController, forgotPasswordController, getAllUsersController, loginController, registerController, testController } from "../controller/authController.js"
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

//delete user by admin
router.delete('/delete-user/:id', requireSignIn, isAdmin, deleteUserController)

//Test Routes
router.get('/test', requireSignIn, isAdmin, testController)

//protected user route
router.get('/user-auth', requireSignIn, (req, res) => {
    res.status(200).send({ ok: true })
})

//protected admin route
router.get('/admin-auth', requireSignIn, isAdmin, (req, res) => {
    res.status(200).send({ ok: true })
})

export default router;