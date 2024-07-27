import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    trxId: {
        type: String,
        require: true,
        trim: true,
    },
    method: {
        type: String,
        default: "Cash",
        enum: ["Cash", "bKash", "Nagad", "Upay", "Rocket", "Debit/Credit Card", "Bank Transfer"],
    },
    amount: {
        type: Number,
        require: true,
    },
    paymentDate: {
        type: String,
        require: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    }
}, { timestamps: true })

export default mongoose.model('Payment', paymentSchema)