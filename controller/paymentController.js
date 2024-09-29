import paymentModel from "../models/paymentModel.js";
import gradeModel from "../models/gradeModel.js";


//create payment
export const createPaymentController = async (req, res) => {
    try {
        const { remark, trxId, method, amount, paymentDate, user, grade } = req.fields;
        //validation
        if (!grade) {
            return res.status(400).send({ message: "Grade is required" });
        }
        if (!user) {
            return res.status(400).send({ message: "User is required" });
        }
        if (!remark) {
            return res.status(400).send({ message: "Remark is required" });
        }
        if (!trxId) {
            return res.status(400).send({ message: "Transaction ID is required" });
        }
        if (!method) {
            return res.status(400).send({ message: "Method is required" });
        }
        if (!amount) {
            return res.status(400).send({ message: "Amount is required" });
        }
        if (!paymentDate) {
            return res.status(400).send({ message: "Payment Date is required" });
        }

        //check for duplicate
        const existingTrxId = await paymentModel.findOne({ trxId })
        if (existingTrxId) {
            return res.status(409).send({
                success: false,
                message: "Transaction ID already exists"
            })
        }

        //save
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

export const trxIdGenController = async (req, res) => {
    try {
        if (!req.fields.grade) {
            return res.status(400).send({ message: "Grade is required" });
        }
        const grade = await gradeModel.findById(req.fields.grade).select("name");
        let gradeSign = '';
        if (grade.name) {
            const parts = grade.name.split(' ');
            if (parts.length > 1) {
                gradeSign = parts[0][0].toUpperCase() + parts[1].slice(0, 2).toUpperCase();
            } else {
                gradeSign = parts[0].slice(0, 3).toUpperCase();
            }
        }

        // Date generation
        const currentDate = new Date();
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[currentDate.getMonth()];
        const year = currentDate.getFullYear().toString().slice(-2);

        //date prefix
        const datePrefix = `${month}${year}`;

        //final prefix generation
        const finalPrefix = `${datePrefix}${gradeSign}`;

        //find duplicate trx id
        const availableTrxIds = await paymentModel.find({}).select("trxId");
        const matchingTrxIds = availableTrxIds.map(payment => payment.trxId).filter(trxId => trxId.startsWith(datePrefix));

        //generate serial number based on available trx ids
        let newSerialNumber;
        if (matchingTrxIds.length > 0) {
            const lastTwoDigits = matchingTrxIds
                .map(id => parseInt(id.slice(-2)))
                .filter(num => !isNaN(num));
            const maxSerialNumber = lastTwoDigits.length > 0 ? Math.max(...lastTwoDigits) : 0;
            newSerialNumber = (maxSerialNumber + 1) % 100;
        } else {
            newSerialNumber = 1;
        }

        const formattedSerialNumber = newSerialNumber.toString().padStart(2, '0');
        const newTrxId = `${finalPrefix}${formattedSerialNumber}`;
        res.status(200).send({
            success: true,
            message: "Transaction ID generated successfully",
            trxId: newTrxId
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error generating transaction ID",
            error: error.message
        });
    }
};

//get single payment
export const getPaymentController = async (req, res) => {
    try {
        const payment = await paymentModel
            .find({ user: req.user._id })
            .populate("user")
            .populate("grade")
            .sort({ createdAt: -1 });
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
            return res.status(400).send({ message: "Remark is required" });
        }
        if (!trxId) {
            return res.status(400).send({ message: "Transaction ID is required" });
        }
        if (!method) {
            return res.status(400).send({ message: "Payment Method is required" });
        }
        if (!amount) {
            return res.status(400).send({ message: "Amount is required" });
        }
        if (!paymentDate) {
            return res.status(400).send({ message: "Date is required" });
        }

        const updatedPayment = await paymentModel.findByIdAndUpdate(req.params.id, { ...req.fields }, { new: true })
        res.status(201).send({
            success: true,
            message: "Payment status updated successfully",
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
            message: "Error while deleting payment status"
        })
    }
}