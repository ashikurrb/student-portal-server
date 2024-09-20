import express from "express"
import formidable from "express-formidable";
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js'
import { createOrderController, deleteOrderController, getAllOrderController, getOrdersController } from "../controller/orderController.js";

//router object
const router = express.Router();

//create order
router.post('/create-order', requireSignIn, formidable(), createOrderController);

//get user order
router.get('/user-order', requireSignIn, getOrdersController);

//get all order
router.get('/all-order', requireSignIn, isAdmin, getAllOrderController);

//delete order
router.delete('/delete-order/:id', requireSignIn, isAdmin, deleteOrderController);

export default router;