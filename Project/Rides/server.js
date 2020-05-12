// Dependencies
const express = require('express');
const apiV1 = require('./routes/v1');
const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
require('dotenv/config');

// Initializing the server
const server = express();
/*
// connecting to mongoDB
mongoose.connect(process.env.DB_CONNECTION,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex : true,
    useFindAndModify : false
});*/

// configuring the server
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());

// to handle CORS
server.use((req,res,next) => {
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS'){
        res.header('Acces-Control-Allow-Methods', 'POST, GET, PUT, DELETE');
        return res.status(200).json({})
    }
    next();
});

// setting the middleware to route the requests
server.use('/api/v1',apiV1);

// handling bad paths/errors
server.use((req,res,next) => {
    res.status(405).json({});
});

server.use((error, req,res,next) => {
    res.status(error.status || 500);
    res.json({});
});

// Listening on port 8080
server.listen(80,function(){
    console.log('Listening on port 8080...');
});
