import express from "express"
import dotenv from "dotenv"
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js"
import gradeRoutes from "./routes/gradeRoute.js"
import resultRoutes from "./routes/resultRoute.js"
import paymentRoutes from "./routes/paymentRoute.js"
import contentRoutes from "./routes/contentRoute.js"
import cors from 'cors'


//dotenv config
dotenv.config();

//database config
connectDB();

// rest object
const app = express();

//middlewares
app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

//routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/grade', gradeRoutes)
app.use('/api/v1/result', resultRoutes)
app.use('/api/v1/payment', paymentRoutes)
app.use('/api/v1/content', contentRoutes)

//rest API
app.get('/', (req, res) => {
    res.send("<h1>C-LAB Student Portal</h1>")
})

//PORT
const PORT = process.env.PORT || 5000;

//Run Listen
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})