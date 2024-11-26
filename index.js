const express = require('express');
const connectDatabase = require('./database/database');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const doctorRouter = require('./routes/doctors');
const reviewRouter = require('./routes/review');
const bookingRouter = require('./routes/booking');
const adminRouter = require('./routes/admin');

const app = express();

const PORT = process.env.PORT || 5000;
const corsOptions = {
    origin: 'http://localhost:5173', // Allow requests from this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
    credentials: true, // Allow cookies to be sent
    optionsSuccessStatus: 204 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);


connectDatabase();

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
