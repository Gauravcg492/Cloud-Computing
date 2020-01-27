// dependencies
const express = require('express');
const usersHandler = require('./users')
const ridesHander = require('./rides')
const dbHandler = require('./db')

// variables
const api = express();

// to route user requests
api.use('/users',usersHandler);

// to route ride requests
api.use('/rides',ridesHander);

// to route db operations
api.use('/db',dbHandler);

// to handle unknown paths and errors
api.use((req, res, next) => {
    res.status(405).json({});
})

// export
module.exports = api;