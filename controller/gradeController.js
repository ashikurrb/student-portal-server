import slugify from "slugify";
import gradeModel from "../models/gradeModel.js";
import userModel from "../models/userModel.js";
import resultModel from "../models/resultModel.js";
import paymentModel from "../models/paymentModel.js";
import contentModel from "../models/contentModel.js";
import noticeModel from "../models/noticeModel.js";
import courseModel from "../models/courseModel.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuration (use in grade for deleting user's avatar while deleting grade )
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//create grade controller
export const createGradeController = async (req, res) => {
    try {
        const { name } = req.fields;
        if (!name) {
            return res.status(401).send({ message: "Name is Required" })
        }
        const existingGrade = await gradeModel.findOne({ slug: slugify(name) })
        if (existingGrade) {
            return res.status(409).send({
                success: false,
                message: "Grade already exists"
            })
        }
        const grade = await new gradeModel
            ({ name, slug: slugify(name) }).save();
        res.status(201).send({
            success: true,
            message: "Grade created successfully",
            grade
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating grade",
            error
        })
    }
}

//update grade controller
export const updateGradeController = async (req, res) => {
    try {
        const { name } = req.fields;
        const { id } = req.params;
        if (!name) {
            return res.status(401).send({ message: "Name is required" })
        }
        const existingGrade = await gradeModel.findOne({ slug: slugify(name) })
        if (existingGrade) {
            return res.status(409).send({
                success: false,
                message: "Grade already exists"
            })
        }
        const grade = await gradeModel.findByIdAndUpdate(id, { name, slug: slugify(name) }, { new: true })
        res.status(200).send({
            success: true,
            message: "Grade updated successfully",
            grade,
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating grade",
            error
        })
    }
}

//get all-grade controller
export const getAllGradesController = async (req, res) => {
    try {
        const grade = await gradeModel.find({})
            .sort({ createdAt: -1 })
        res.status(200).send({
            success: true,
            message: "Grade List fetched successfully",
            grade,
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching grade list",
            error
        })
    }
}

//get single grade
export const getSingleGradeController = async (req, res) => {
    try {
        const grade = await gradeModel.findOne({ slug: req.params.slug })
        res.status(200).send({
            success: true,
            message: "Grade fetched successfully",
            grade,
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching grade",
            error
        })
    }
}

//delete grade
export const deleteGradeController = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the user, notice, and course 
        const user = await userModel.findOne({ grade: id });
        const notice = await noticeModel.findOne({ grade: id });
        const course = await courseModel.findOne({ grade: id });

        // initialize promises array for deletion
        const deletePromises = [];

        // Delete avatar and Cloudinary images if user exists
        if (user) {
            // Delete user avatar from Cloudinary
            const publicId = user.avatar
                ? `5points-student-portal/avatar/${user.avatar.split('/').pop().split('.')[0]}`
                : null;
            if (publicId) {
                deletePromises.push(cloudinary.uploader.destroy(publicId));
            }
            deletePromises.push(userModel.deleteMany({ grade: id }));
        }

        // Delete notice image from Cloudinary if notice exists
        if (notice) {
            const noticeId = notice.noticeImg
                ? `5points-student-portal/notices/${notice.noticeImg.split('/').pop().split('.')[0]}`
                : null;
            if (noticeId) {
                deletePromises.push(cloudinary.uploader.destroy(noticeId));
            }
            deletePromises.push(noticeModel.deleteMany({ grade: id }));
        }

        // Delete course image from Cloudinary if course exists
        if (course) {
            const courseId = course.courseImg
                ? `5points-student-portal/courses/${course.courseImg.split('/').pop().split('.')[0]}`
                : null;
            if (courseId) {
                deletePromises.push(cloudinary.uploader.destroy(courseId));
            }
            deletePromises.push(courseModel.deleteMany({ grade: id }));
        }

        // Delete the grade and related data
        deletePromises.push(
            gradeModel.findByIdAndDelete(id),
            resultModel.deleteMany({ grade: id }),
            paymentModel.deleteMany({ grade: id }),
            contentModel.deleteMany({ grade: id })
        );

        // Execute all deletion promises
        await Promise.all(deletePromises);

        res.status(200).send({
            success: true,
            message: "Grade deleted successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error deleting grade",
        });
    }
};
