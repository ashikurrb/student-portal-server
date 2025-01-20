import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        trim: true,
    },
    subjects: [
        {
            subject: {
                type: String,
                required: true,
                trim: true,
            },
            marks: {
                type: String,
                required: true,
            },
        },
    ],
    examDate: {
        type: Date,
        require: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: true,
    }
}, { timestamps: true })

export default mongoose.model('Result', resultSchema)