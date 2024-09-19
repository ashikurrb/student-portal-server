import courseModel from '../models/courseModel.js';
import slugify from "slugify";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const createCourseController = async (req, res) => {
    try {
        const { title, grade, price, dateRange, description, status } = req.fields;
        const file = req.files.photo;

        //validation
        if (!title) {
            return res.status(400).send({ message: "Course name is required" });
        } if (!grade) {
            return res.status(400).send({ message: "Grade is required" });
        }
        if (!price) {
            return res.status(400).send({ message: "Price is required" });
        }
        if (!dateRange) {
            return res.status(400).send({ message: "Date is required" });
        }
        if (!status) {
            return res.status(400).send({ message: "Status is required" });
        }
        if (!file) {
            return res.status(400).send({ message: "Course Image is required" });
        }

        // const existingCourse = await courseModel.findOne({ slug: slugify(title) })
        // if (existingCourse) {
        //     return res.status(409).send({
        //         success: false,
        //         message: "Course already exists"
        //     })
        // }

        // Initialize course
        const courseData = { grade, title, slug: slugify(title), price, dateRange, description, status };
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: '5points-student-portal/courses',
                use_filename: true,
                unique_filename: false
            });
            courseData.courseImg = result.secure_url;
        } catch (uploadError) {
            console.error('Cloudinary Upload Error:', uploadError);
            return res.status(500).send({ message: 'Upload failed', error: uploadError.message });
        }

        // Create and save course
        const course = new courseModel(courseData);
        await course.save();
        res.status(201).send({
            success: true,
            message: "Course created successfully",
            course
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating course",
            error
        });
    }
}

//get all course
export const getAllCoursesController = async (req, res) => {
    try {
        const courses = await courseModel
            .find({})
            .populate("grade")
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching all courses",
            error
        })
    }
};

//get single course
export const getCourseController = async (req, res) => {
    try {
        const course = await courseModel
            .findOne({ slug: req.params.slug })
            .populate("grade")
            .sort({ createdAt: -1 });
        res.json(course);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching course",
            error
        })
    }
};

//update course
export const updateCourseController = async (req, res) => {
    try {
        const { title, price, dateRange, description, status } = req.fields;
        const file = req.files.photo;
        const courseId = req.params.id;

        //validation
        if (!title) {
            return res.status(400).send({ message: "Course name is required" });
        }
        if (!price) {
            return res.status(400).send({ message: "Price is required" });
        }
        if (!dateRange) {
            return res.status(400).send({ message: "Date is required" });
        }
        if (!status) {
            return res.status(400).send({ message: "Status is required" });
        }

        // Fetch existing notice
        const course = await courseModel.findById(courseId);

        //set update data
        const courseData = { title, slug: slugify(title), price, dateRange, description, status };

        if (file) {
            // If old image exists, delete it
            if (course.courseImg) {
                const publicId = course.courseImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`5points-student-portal/courses/${publicId}`);
            }
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: '5points-student-portal/courses'
                });
                //save photo url to database
                courseData.courseImg = result.secure_url;

            } catch (uploadError) {
                console.error('Cloudinary Upload Error:', uploadError);
                return res.status(500).send({ message: 'Upload failed', error: uploadError.message });
            }
        }

        // Update course
        const updatedCourse = await courseModel.findByIdAndUpdate(courseId, { ...courseData }, { new: true });
        res.status(200).send({
            success: true,
            message: "Course updated successfully",
            updatedCourse
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating course",
            error
        });
    }
}

//delete course
export const deleteCourseController = async (req, res) => {
    try {
        const course = await courseModel.findByIdAndDelete(req.params.id);

        // If old image exists, delete it
        if (course.courseImg) {
            const publicId = course.courseImg.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`5points-student-portal/courses/${publicId}`);
        }
        res.status(200).send({
            success: true,
            message: "Course deleted successfully",
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error deleting course",
            error
        })
    }
}