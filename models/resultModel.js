import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    subject: {
        type: String,
        require: true,
        trim: true,
    },
    marks: {
        type: String,
        require: true,
    },
    examDate: {
        type: String,
        require: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    }
}, { timestamps: true })

export default mongoose.model('Result', resultSchema)