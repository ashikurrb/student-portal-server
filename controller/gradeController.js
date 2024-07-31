import slugify from "slugify";
import gradeModel from "../models/gradeModel.js";
import contentModel from "../models/contentModel.js";

//create grade controller
export const createGradeController = async (req, res) => {
    try {
        const { name } = req.fields;
        if (!name) {
            return res.status(401).send({ message: "Name is Required" })
        }
        const existingGrade = await gradeModel.findOne({ name })
        if (existingGrade) {
            return res.status(200).send({
                success: true,
                message: "Grade already exist"
            })
        }
        const grade = await new gradeModel
            ({ name, slug: slugify(name) }).save();
        res.status(201).send({
            success: true,
            message: "New Grade Created",
            grade
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while Creating Grade",
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
            return res.status(401).send({ message: "Name is Required" })
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
            message: "Error while updating Grade",
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
            message: "Grades List fetched successfully",
            grade,
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching All Grades",
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
            message: "Error while fetching single Grade",
            error
        })
    }
}

//delete grade
export const deleteGradeController = async (req, res) => {
    try {
        const { id } = req.params;
        const grade = await gradeModel.findById(id);
        await Promise.all([
            gradeModel.findByIdAndDelete(id),
            contentModel.deleteMany({ grade: id }),
        ]);
        res.status(200).send({
            success: true,
            message: "Grade deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while deleting Grade"
        })
    }
}