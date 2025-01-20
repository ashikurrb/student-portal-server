import express from 'express';
import formidable from "express-formidable";
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';
import { createResultController, deleteResultController, getAllResultController, getResultController, updateResultController } from '../controller/resultController.js';

const router = express.Router();

//routes

//create result
router.post('/create-result', requireSignIn, isAdmin, createResultController)

//get single result
router.get('/user-result', requireSignIn, getResultController)

//get all result
router.get('/all-result', requireSignIn, isAdmin, getAllResultController)

//update result
router.put('/update-result/:id', requireSignIn, isAdmin, updateResultController)

//delete result
router.delete('/delete-result/:id', requireSignIn, isAdmin, deleteResultController)

export default router;