import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    method: {
        type: String,
        enum: ["bKash", "Rocket"],
        required: true,
    },
    accNumber: {
        type: Number,
        required: true,
    },
    trxId: {
        type: String,
        require: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Canceled"],
        default: "Pending",
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
}, { timestamps: true })

export default mongoose.model("Order", orderSchema)