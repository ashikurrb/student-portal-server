import express from "express"
import formidable from "express-formidable";
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js'
import { createCourseController, deleteCourseController, getAllCoursesController, getCourseController, getGradeCourseController, getRelatedCourseController, updateCourseController } from "../controller/courseController.js";

//router object
const router = express.Router();

//create course
router.post('/create-course', requireSignIn, isAdmin, formidable(), createCourseController);

//get all course
router.get('/all-courses', getAllCoursesController);

//get single course
router.get('/get-course/:slug', getCourseController);

//get grade wise course
router.get('/grade-course/:slug', getGradeCourseController);

//get same grade related course
router.get('/related-course/:cid/:gid', getRelatedCourseController);

//update course
router.put('/update-course/:id', requireSignIn, isAdmin, formidable(), updateCourseController);

//delete course
router.delete('/delete-course/:id', requireSignIn, isAdmin, deleteCourseController);

export default router;