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
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/ashikurrb/image/upload/v1722701852/5points-student-portal/default_avatar.png",
    },
    role: {
        type: Number,
        default: 0
    },

}, { timestamps: true })

export default mongoose.model('users', userSchema)