import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true,
        trim: true,
    },
    noticeInfo: {
        type: String,
        require: true,
    },
    noticeImg: {
        type: String,
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
    }
}, { timestamps: true })

export default mongoose.model('Notice', noticeSchema)