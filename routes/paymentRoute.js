import express from 'express';
import formidable from "express-formidable";
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';
import { createPaymentController, deletePaymentController, getAllPaymentController, getPaymentController } from '../controller/paymentController.js';

const router = express.Router();

//routes

//create payment
router.post('/create-payment', requireSignIn, isAdmin, formidable(), createPaymentController)

//get all payment
router.get('/user-payment', requireSignIn, getPaymentController)

//get all payment
router.get('/all-payment', requireSignIn, isAdmin, getAllPaymentController)

//delete payment
router.delete('/delete-payment/:id', requireSignIn, isAdmin, deletePaymentController)

export default router;