// dependencies
const express = require('express');
const ridesHander = require('./rides');
const dbHandler = require('./db');
const countHandler = require('./count');
const fs = require('fs');

// variables
const api = express();
const pathToFile = __dirname + '/data/counts.json';

// to route ride requests
//api.use('/rides',ridesHander);
api.use('/rides',async (req,res,next) =>{
    var counts = JSON.parse(fs.readFileSync(pathToFile));
    counts.count += 1;
    fs.writeFileSync(pathToFile,JSON.stringify(counts));
    next();
},ridesHander);

// to route db operations
api.use('/db',dbHandler);

// to return count
api.use('/_count',countHandler);

// to handle unknown paths and errors
api.use((req, res, next) => {
    res.status(405).json({});
});

// export
module.exports = api;
