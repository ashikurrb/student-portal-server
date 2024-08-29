import noticeModel from "../models/noticeModel.js";
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


export const createNoticeController = async (req, res) => {
    try {
        const { title, noticeInfo, grade } = req.fields;
        const file = req.files.photo;

        // Validation
        if (!title) {
            return res.status(400).send({ message: "Title is required" });
        }
        if (!noticeInfo) {
            return res.status(400).send({ message: "Notice Info is required" });
        }

        // Initialize notice object
        const noticeData = { title, noticeInfo, grade };

        // Handle image upload if a file is provided
        if (file) {
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: '5points-student-portal/notices',
                    use_filename: true,
                    unique_filename: false
                });
                noticeData.noticeImg = result.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary Upload Error:', uploadError);
                return res.status(500).send({ message: 'Upload to Cloudinary failed', error: uploadError.message });
            }
        }

        // Create and save notice
        const notice = new noticeModel(noticeData);
        await notice.save();

        res.status(201).send({
            success: true,
            message: "Notice created successfully",
            notice,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating notice",
            error
        });
    }
};

//get all notice
export const getAllNoticeController = async (req, res) => {
    try {
        const notices = await noticeModel
            .find({})
            .populate("grade")
            .sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching notices",
            error
        });
    }
}

//get notice
export const getGradeNoticeController = async (req, res) => {
    try {
        // Fetch the logged-in user's data using the user ID
        const user = await userModel.findById(req.user);

        // Get the grade of the logged-in user
        const userGrade = user.grade;

        // Find notices that match the user's grade or have no grade specified
        const notices = await noticeModel.find({
            $or: [
                { grade: userGrade },   // Matches the user's grade
                { grade: null }         // No grade specified
            ]
        })
            .populate("grade")
            .sort({ updatedAt: -1 });
        res.json(notices);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching notices",
            error
        });
    }
}

//update notice
export const updateNoticeController = async (req, res) => {
    try {
        const { title, noticeInfo, grade } = req.fields;
        const file = req.files.photo;
        const noticeId = req.params.id;

        // Validation
        if (!title) {
            return res.status(400).send({ message: "Title is required" });
        }
        if (!noticeInfo) {
            return res.status(400).send({ message: "Message is required" });
        }

        // Fetch existing notice
        const notice = await noticeModel.findById(noticeId);

        // If old image exists, delete it
        if (notice.noticeImg) {
            const publicId = notice.noticeImg.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`5points-student-portal/notices/${publicId}`);
        }

        // Initialize noticeData object
        const noticeData = { title, noticeInfo, grade };

        // Handle image upload if a file is provided
        if (file) {
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: '5points-student-portal/notices'
                });
                noticeData.noticeImg = result.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary Upload Error:', uploadError);
                return res.status(500).send({ message: 'Upload to Cloudinary failed', error: uploadError.message });
            }
        }

        // Update notice
        const updatedNotice = await noticeModel.findByIdAndUpdate(noticeId, { ...noticeData }, { new: true });
        res.status(200).send({
            success: true,
            message: "Notice updated successfully",
            updatedNotice,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating notice",
            error
        });
    }
}


//delete notice
export const deleteNoticeController = async (req, res) => {
    try {
        const notice = await noticeModel.findByIdAndDelete(req.params.id);
         // If old image exists, delete it
         if (notice.noticeImg) {
            const publicId = notice.noticeImg.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`5points-student-portal/notices/${publicId}`);
        }
        res.status(200).send({
            success: true,
            message: "Notice deleted successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error deleting notice",
            error
        });
    }
}