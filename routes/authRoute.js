import express from "express"
import { loginController, registerController, testController } from "../controller/authController.js"
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js'

//router object
const router = express.Router();

//routing

//REGISTER || Method: POST
router.post('/register', registerController)

//Login || Method: POST
router.post('/login', loginController)

//Test Routes
router.get('/test', requireSignIn, isAdmin, testController)


export default router;