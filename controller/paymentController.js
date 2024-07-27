import paymentModel from "../models/paymentModel.js";


//create payment
export const createPaymentController = async (req, res) => {
    try {
        const { trxId, method, amount, paymentDate, user } = req.fields;
        //validation
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

        const payment = new paymentModel({ ...req.fields });
        await payment.save();
        res.status(201).send({
            success: true,
            message: "Payment Status Created Successfully",
            payment,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while Creating Payment Status",
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
            message: 'Error fetching Payment Status',
            error
        })
    }
}

//get all result
export const getAllPaymentController = async (req, res) => {
    try {
        const payment = await paymentModel
            .find({})
            .populate("user")
            .sort({ createdAt: -1 });
        res.json(payment);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching All Payment List",
            error
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
            message: "Payment Status deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while deleting Payment Status"
        })
    }
}