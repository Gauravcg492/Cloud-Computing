const mongoose = require('mongoose');
const workers = require('./workers');
require('dotenv/config');

const worker = process.env.WORKER;
const connection = mongoose.connection;

mongoose.connect(process.env.DB_CONNECTION,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex : true,
    useFindAndModify : false
});

// checking if connection established
connection.once('open', () => {
    console.log('Connection Established with Mongo');
});

console.log("Starting worker");

if(worker == 'MASTER') {
    console.log("Entering write");
    workers.write();
} else {
    console.log("Entering read");
    workers.read();
}