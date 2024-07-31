import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        require: true,
    },
    password: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    avatarUrl: {
        type: String,
    },
    role: {
        type: Number,
        default: 0
    },
    
}, { timestamps: true })

export default mongoose.model('users', userSchema)