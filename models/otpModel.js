import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
}, { timestamps: true })

export default mongoose.model('Otp', otpSchema);
