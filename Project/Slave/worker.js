const mongoose = require('mongoose');
const workers = require('./workers');

const worker = process.env.WORKER;

mongoose.connect(process.env.DB_CONNECTION,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex : true,
    useFindAndModify : false
});


if(worker == 'MASTER') {
    workers.write();
} else {
    workers.read('data');
}