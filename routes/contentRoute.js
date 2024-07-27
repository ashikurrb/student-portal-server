import express from 'express';
import formidable from "express-formidable";
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';
import { createContentController, deleteContentController, getAllContentController, getContentController } from '../controller/contentController.js';

const router = express.Router();

//routes

//create content
router.post('/create-content', requireSignIn, isAdmin, formidable(), createContentController);

//get single content
router.get('/user-content', requireSignIn, getContentController);

//get all content
router.get('/all-content', requireSignIn, isAdmin, getAllContentController);

//delete content
router.delete('/delete-content/:id', requireSignIn, isAdmin, deleteContentController);

export default router;