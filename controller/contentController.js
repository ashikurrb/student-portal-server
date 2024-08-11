import contentModel from "../models/contentModel.js";
import userModel from "../models/userModel.js";

export const createContentController = async (req, res) => {
    try {
        const { subject, remark, type, contentLink, grade } = req.fields;
        //validation
        if (!grade) {
            return res.status(400).send({ message: "Grade is required" });
        }
        if (!type) {
            return res.status(400).send({ message: "Type is required" });
        }
        if (!subject) {
            return res.status(400).send({ message: "Subject is required" });
        }
        if (!remark) {
            return res.status(400).send({ message: "Remark is required" });
        }
        if (!contentLink) {
            return res.status(400).send({ message: "Content Link is required" });
        }

        const content = new contentModel({ ...req.fields });
        await content.save();
        res.status(201).send({
            success: true,
            message: "Content created successfully",
            content,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating content",
            error
        });
    }
}

//get single content
export const getContentController = async (req, res) => {
    try {
        // Fetch the logged-in user's data using the user ID
        const user = await userModel.findById(req.user);
        // Get the grade of the logged-in user
        const userGrade = user.grade;

        // Find the content that matches the user's grade
        const content = await contentModel
            .find({ grade: userGrade })
            .populate("grade", "_id");
        res.json(content);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching content",
            error
        });
    }
}


//get all content
export const getAllContentController = async (req, res) => {
    try {
        const content = await contentModel
            .find({})
            .populate("grade")
            .sort({ createdAt: -1 });
        res.json(content);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching all contents",
            error
        });
    }
}

//update content
export const updateContentController = async (req, res) => {
    try {
        const { subject, remark, type, contentLink } = req.fields;
        //validation
        if (!subject) {
            return res.status(400).send({ message: "Subject is required" });
        }
        if (!remark) {
            return res.status(400).send({ message: "Remark is required" });
        }
        if (!type) {
            return res.status(400).send({ message: "Type is required" });
        }
        if (!contentLink) {
            return res.status(400).send({ message: "Content Link is required" });
        }

        const updatedContent = await contentModel.findByIdAndUpdate(req.params.id, { ...req.fields }, { new: true })
        res.status(201).send({
            success: true,
            message: "Content updated successfully",
            updatedContent,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error updating content",
        });
    }
}

//delete content
export const deleteContentController = async (req, res) => {
    try {
        const { id } = req.params;
        await contentModel.findByIdAndDelete(id);
        res.status(200).send({
            success: true,
            message: "Content deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while deleting content"
        })
    }
}