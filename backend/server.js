//DEPENDANCIES 
const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const connectDB = require('./db/connection');
const PORT = process.env.PORT;

//DATABASE CONNECTION
connectDB();
//MIDDLEWARE
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

//MOUNT ROUTES 

//PORT 
app.listen(PORT, () =>{
    console.log(`Server is now running on port: http://localhost:${PORT}`);
})