import contentModel from "../models/contentModel.js";

export const createContentController = async (req, res) => {
    try {
        const { subject, remark, type, contentLink, grade } = req.fields;
        //validation
        if (!subject) {
            return res.status(400).send({ message: "Subject is Required" });
        }
        if (!remark) {
            return res.status(400).send({ message: "Remark is Required" });
        }
        if (!type) {
            return res.status(400).send({ message: "Type is Required" });
        }
        if (!contentLink) {
            return res.status(400).send({ message: "Content Link is Required" });
        }
        if (!grade) {
            return res.status(400).send({ message: "Grade is Required" });
        }

        const content = new contentModel({ ...req.fields });
        await content.save();
        res.status(201).send({
            success: true,
            message: "Content Link Created Successfully",
            content,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while Creating Content Link",
            error
        });
    }
}

//get single content
export const getContentController = async (req, res) => {
    try {
        const content = await contentModel
            .find({ grade: req.grade._id })
        res.json(content);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching Contents',
            error
        })
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
            message: "Error while fetching All Content List",
            error
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
            message: "Error while deleting Content"
        })
    }
}