import paymentModel from "../models/paymentModel.js";


//create payment
export const createPaymentController = async (req, res) => {
    try {
        const { remark, trxId, method, amount, paymentDate, user, grade } = req.fields;
        //validation
        if (!remark) {
            return res.status(400).send({ message: "Remark is Required" });
        }
        if (!trxId) {
            return res.status(400).send({ message: "Transaction ID is Required" });
        }
        if (!method) {
            return res.status(400).send({ message: "Method is Required" });
        }
        if (!amount) {
            return res.status(400).send({ message: "Amount is Required" });
        }
        if (!paymentDate) {
            return res.status(400).send({ message: "Payment Date is Required" });
        }
        if (!user) {
            return res.status(400).send({ message: "User is Required" });
        }
        if (!grade) {
            return res.status(400).send({ message: "Grade is Required" });
        }

        const payment = new paymentModel({ ...req.fields });
        await payment.save();
        res.status(201).send({
            success: true,
            message: "Payment status created successfully",
            payment,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating payment status",
            error
        });
    }
};

//get single payment
export const getPaymentController = async (req, res) => {
    try {
        const payment = await paymentModel
            .find({ user: req.user._id })
        res.json(payment);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching payment status',
            error
        })
    }
}

//get all payment status
export const getAllPaymentController = async (req, res) => {
    try {
        const payment = await paymentModel
            .find({})
            .populate("user")
            .populate("grade")
            .sort({ createdAt: -1 });
        res.json(payment);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error fetching all payment details",
            error
        });
    }
}

//update payment
export const updatePaymentController = async (req, res) => {
    try {
        const { remark, trxId, method, amount, paymentDate } = req.fields;
        //validation
        if (!remark) {
            return res.status(400).send({ message: "Remark is Required" });
        }
        if (!trxId) {
            return res.status(400).send({ message: "Transaction ID is Required" });
        }
        if (!method) {
            return res.status(400).send({ message: "Payment Method is Required" });
        }
        if (!amount) {
            return res.status(400).send({ message: "Amount is Required" });
        }
        if (!paymentDate) {
            return res.status(400).send({ message: "Date is Required" });
        }

        const updatedPayment = await paymentModel.findByIdAndUpdate(req.params.id, { ...req.fields }, { new: true })
        res.status(201).send({
            success: true,
            message: "Payment updated successfully",
            updatedPayment,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error updating payment status",
        });
    }
}

//delete Payment Status
export const deletePaymentController = async (req, res) => {
    try {
        const { id } = req.params;
        await paymentModel.findByIdAndDelete(id);
        res.status(200).send({
            success: true,
            message: "Payment status deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error deleting payment status"
        })
    }
}