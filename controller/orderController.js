import orderModel from "../models/orderModel.js";


//create order
export const createOrderController = async (req, res) => {
    try {
        const { method, accNumber, trxId, course } = req.fields;
        //validation
        if (!method) {
            return res.status(400).send({ message: "Payment method is required" });
        }
        if (!accNumber) {
            return res.status(400).send({ message: "MFS Number is required" });
        }
        if (!trxId) {
            return res.status(400).send({ message: "Transaction ID is required" });
        }

        const order = new orderModel({ ...req.fields, buyer: req.user._id });
        await order.save();
        res.status(201).send({
            success: true,
            message: "Order placed successfully",
            order,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error order creating",
            error
        });
    }
};

//get user order
export const getOrdersController = async (req, res) => {
    try {
        const orders = await orderModel
            .find({ buyer: req.user._id })
            .populate("buyer")
            .populate("course")
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching orders',
            error
        })
    }
};

// Get all orders
export const getAllOrderController = async (req, res) => {
    try {
        const orders = await orderModel.find({})
            .populate("course")
            .populate({
                path: "buyer",
                select: "-password -answer",
            })
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching orders',
            error
        });
    }
};

//delete order
export const deleteOrderController = async (req, res) => {
    try {
        const { id } = req.params;
        await orderModel.findByIdAndDelete(id);
        res.status(200).send({
            success: true,
            message: "Order deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error deleting order"
        })
    }
}