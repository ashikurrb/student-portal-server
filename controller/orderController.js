import orderModel from "../models/orderModel.js";
import dotenv from 'dotenv';
import { CourierClient } from '@trycourier/courier';

dotenv.config();

//courier mail token
const courier = new CourierClient({ authorizationToken: process.env.COURIER_AUTH_TOKEN });

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

        await order.populate("buyer", "email name")
        await order.populate("course", "title price dateRange")
        await order.save();


        // Send confirmation email via Courier
        const { requestId } = await courier.send({
            message: {
                to: {
                    email: order.buyer.email
                },
                template: process.env.COURIER_ORDER_PURCHASE_TEMPLATE_KEY, 
                data: {
                    name: order.buyer.name, 
                    courseName: order.course.title,
                    price: order.course.price,
                    dateRange: order.course.dateRange, 
                    orderStatus: order.status,
                    paymentMethod: order.method,
                    accNumber: order.accNumber,
                    trxId: order.trxId,
                    orderDate: order.createdAt,
                },
                routing: {
                    method: "single",
                    channels: ["email"],
                },
            },
        });


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
            .populate({
                path: "course",
                populate: "grade"
            })
            .populate({
                path: "buyer",
                select: "-password -answer",
                populate: "grade"
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

//update order status
export const orderStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await orderModel
            .findByIdAndUpdate(id, { status }, { new: true })
        res.status(201).send({
            success: true,
            message: "Status updated successfully",
            order,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error updating order status",
            error,
        });
    }
}

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