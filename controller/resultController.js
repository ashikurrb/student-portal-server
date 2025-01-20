import resultModel from '../models/resultModel.js'
import userModel from '../models/userModel.js'

//create result
export const createResultController = async (req, res) => {
    try {
        const { type, subjects, examDate, user, grade } = req.body;

        // Validation
        if (!type) {
            return res.status(400).send({ message: "Exam type is required" });
        }
        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).send({
                message: "Minimum one subject is required",
            });
        }
        for (const item of subjects) {
            if (!item.subject || !item.marks) {
                return res.status(400).send({
                    message: "Subject and marks are required",
                });
            }
        }
        if (!examDate) {
            return res.status(400).send({ message: "Exam date is required" });
        }
        if (!user) {
            return res.status(400).send({ message: "User is required" });
        }
        if (!grade) {
            return res.status(400).send({ message: "Grade is required" });
        }

        // Create a new result
        const results = new resultModel({
            type,
            subjects,
            examDate,
            user,
            grade,
        });
        await results.save();

        res.status(201).send({
            success: true,
            message: "Result created successfully",
            results,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error creating result",
            error,
        });
    }
};

//get single result
export const getResultController = async (req, res) => {
    try {
        const result = await resultModel
            .find({ user: req.user._id })
            .populate("grade")
            .sort({ createdAt: -1 });

        //user status validation
        const user = await userModel.findById(req.user);
        if (user.status === "Disabled") {
            return res.status(404).json({
                success: false,
                error: "Temporarily Blocked. Contact Admin",
            })
        }
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching result',
            error
        })
    }
}

//get all result
export const getAllResultController = async (req, res) => {
    try {
        const result = await resultModel
            .find({})
            .populate("user")
            .populate("grade")
            .sort({ createdAt: -1 });
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching all results",
            error
        });
    }
}

//update result
export const updateResultController = async (req, res) => {
    try {
        const { type, subjects, examDate } = req.body;

        // Validation
        if (!type) {
            return res.status(400).send({ message: "Exam type is required" });
        }
        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).send({
                message: "Mimimum one subject is required",
            });
        }
        for (const item of subjects) {
            if (!item.subject || !item.marks) {
                return res.status(400).send({
                    message: "Subject and Marks values are required",
                });
            }
        }
        if (!examDate) {
            return res.status(400).send({ message: "Exam date is required" });
        }

        // Update the result
        const updatedResult = await resultModel.findByIdAndUpdate(
            req.params.id,
            { type, subjects, examDate },
            { new: true }
        );

        res.status(200).send({
            success: true,
            message: "Result updated successfully",
            updatedResult,
        });
    } catch (error) {
        console.error("Error updating result:", error);
        res.status(500).send({
            success: false,
            message: "Error updating result",
            error,
        });
    }
};

//delete result
export const deleteResultController = async (req, res) => {
    try {
        const { id } = req.params;
        await resultModel.findByIdAndDelete(id);
        res.status(200).send({
            success: true,
            message: "Result deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error deleting result"
        })
    }
}