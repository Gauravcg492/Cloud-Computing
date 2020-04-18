// Dependencies
const express = require('express');
const dbi = require('./routes/db');
const crash = require('./routes/crash');
const worker = require('./routes/worker');
const bodyParser = require('body-parser');
require('dotenv/config');

// Initializing the server
const server = express();
const PORT = 80;

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
server.use('/api/v1/db',dbi);
server.use('/api/v1/crash',crash);
server.use('/api/v1/worker',worker);

// handling bad paths/errors
server.use((req,res,next) => {
    res.status(405).json({});
});

server.use((error, req,res,next) => {
    res.status(error.status || 500);
    res.json({});
});

// Listening on port 8080
server.listen(PORT,function(){
    console.log(`Listening on port ${PORT}...`);
});
