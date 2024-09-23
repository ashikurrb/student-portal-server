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

        // Find the grade and check if it exists
        const grade = await gradeModel.findById(id);
        if (!grade) {
            return res.status(404).send({
                success: false,
                message: "Grade not found",
            });
        }

        // Find the user associated with the grade
        const user = await userModel.findOne({ grade: id });
        if (user) {
            // Extract public_id from the Cloudinary URL
            const avatarUrl = user.avatar;
            const publicId = avatarUrl
                ? '5points-student-portal/avatar/' + avatarUrl.split('/').pop().split('.')[0]
                : null;

            // Delete related records and Cloudinary image if exists
            await Promise.all([
                gradeModel.findByIdAndDelete(id),
                userModel.deleteMany({ grade: id }),
                publicId ? cloudinary.uploader.destroy(publicId) : null,
                resultModel.deleteMany({ grade: id }),
                paymentModel.deleteMany({ grade: id }),
                contentModel.deleteMany({ grade: id }),
                noticeModel.deleteMany({ grade: id }),
                courseModel.deleteMany({ grade: id }),
            ]);
        } else {
            // If no user found, just delete the grade
            await Promise.all([
                gradeModel.findByIdAndDelete(id),
                resultModel.deleteMany({ grade: id }),
                paymentModel.deleteMany({ grade: id }),
                contentModel.deleteMany({ grade: id }),
                noticeModel.deleteMany({ grade: id }),
                courseModel.deleteMany({ grade: id }),
            ]);
        }

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