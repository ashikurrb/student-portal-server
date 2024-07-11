import express from 'express';
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js'
import { createGradeController, deleteGradeController, getAllGradesController, getSingleGradeController, updateGradeController } from '../controller/gradeController.js';

const router = express.Router();

//routes

//create grade
router.post('/create-grade', requireSignIn, isAdmin, createGradeController)

//update grade
router.put('/update-grade/:id', requireSignIn, isAdmin, updateGradeController)

//get all grade
router.get('/all-grades', getAllGradesController)

//get single grade
router.get('/single-grade/:slug', getSingleGradeController)

//delete grade
router.delete('/delete-grade/:id', requireSignIn, isAdmin, deleteGradeController)


export default router;