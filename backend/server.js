//DEPENDANCIES 
const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const PORT = process.env.PORT;

//MIDDLEWARE
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

//DATABASE CONNECTION

//MOUNT ROUTES 

//PORT 
app.listen(PORT, () =>{
    console.log(`Server is now running on port: http://localhost:${PORT}`);
})