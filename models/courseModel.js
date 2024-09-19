import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
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
    dateRange: {
        type: Date,
        require: true,
    },
    description: {
        type: String,
        require: true,
    },
    status: {
        type: String,
        default: "active",
        enum: ["Active", "Closed", "Upcoming"],
    },
    courseImg: {
        type: String,
        require: true,
    },
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);