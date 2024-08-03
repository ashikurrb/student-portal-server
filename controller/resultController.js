import slugify from 'slugify';
import resultModel from '../models/resultModel.js'

//create result
export const createResultController = async (req, res) => {
    try {
        const { type, subject, marks, examDate, user, grade } = req.fields;
        //validation
        if (!type) {
            return res.status(400).send({ message: "Exam Type is Required" });
        }
        if (!subject) {
            return res.status(400).send({ message: "Subject is Required" });
        }
        if (!marks) {
            return res.status(400).send({ message: "Marks is Required" });
        }
        if (!examDate) {
            return res.status(400).send({ message: "Date is Required" });
        }
        if (!user) {
            return res.status(400).send({ message: "User is Required" });
        }
        if (!grade) {
            return res.status(400).send({ message: "Grade is Required" });
        }

        const results = new resultModel({ ...req.fields });
        await results.save();
        res.status(201).send({
            success: true,
            message: "Result Created Successfully",
            results,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating result",
            error
        });
    }
};

//get single result
export const getResultController = async (req, res) => {
    try {
        const result = await resultModel
            .find({ user: req.user._id })
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
            message: "Error fetching all Results",
            error
        });
    }
}

//update result
export const updateResultController = async (req, res) => {
    try {
        const { type, subject, marks, examDate } = req.fields;
        //validation
        if (!type) {
            return res.status(400).send({ message: "Exam Type is Required" });
        }
        if (!subject) {
            return res.status(400).send({ message: "Subject is Required" });
        }
        if (!marks) {
            return res.status(400).send({ message: "Marks is Required" });
        }
        if (!examDate) {
            return res.status(400).send({ message: "Date is Required" });
        }

        const updatedResult = await resultModel.findByIdAndUpdate(req.params.id, { ...req.fields }, { new: true })
        res.status(201).send({
            success: true,
            message: "Result Updated Successfully",
            updatedResult,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error updating result",
        });
    }
}

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
            message: "Error deleting Result"
        })
    }
}