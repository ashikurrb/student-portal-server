import express from "express"
import formidable from "express-formidable";
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js'
import { createNoticeController, deleteNoticeController, getAllNoticeController, getGradeNoticeController, updateNoticeController } from "../controller/noticeController.js";

//router object
const router = express.Router();

//routing

//create notice
router.post('/create-notice', requireSignIn, isAdmin, formidable(), createNoticeController);

//get all notice
router.get('/all-notices',requireSignIn, isAdmin, getAllNoticeController);

//get notice by grade id
router.get('/get-notice', requireSignIn, getGradeNoticeController);

//update notice
router.put('/update-notice/:id', requireSignIn, isAdmin, formidable(), updateNoticeController);

//delete notice
router.delete('/delete-notice/:id', requireSignIn, isAdmin, deleteNoticeController);

export default router;