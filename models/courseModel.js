import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        unique: true,
    },
    slug: {
        type: String,
        lowercase: true,
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grade",
    },
    price: {
        type: Number,
        require: true,
    },
    duration: {
        type: Number,
        require: true,
    },
    startingDate: {
        type: Date,
        require: true,
    },
    description: {
        type: String,
        require: true,
    },
    banner: {
        type: String,
        require: true,
    },
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);