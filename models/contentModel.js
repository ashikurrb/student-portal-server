import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
    subject: {
        type: String,
        require: true,
        trim: true,
    },
    remark: {
        type: String,
        require: true,
        trim: true,
    },
    type: {
        type: String,
        default: "PDF",
        enum: ["PDF", "Doc", "Slide", "Spreadsheet", "Video", "Audio", "Online Class"],
        require: true,
    },
    contentLink: {
        type: String,
        require: true,
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: true,
    }
}, { timestamps: true })

export default mongoose.model('Content', contentSchema)