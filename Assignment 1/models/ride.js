// dependencies
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

// initialize the incrementor
autoIncrement.initialize(mongoose.connection);

// defining ride schema
const rideSchema = mongoose.Schema({
    rideId : Number,
    created_by : {
        type : String,
        required : true,
    },
    timestamp : {
        type : String,
        required : true
    },
    source : {
        type : Number,
        required : true
    },
    destination : {
        type : Number,
        required : true
    }
});

rideSchema.plugin(autoIncrement.plugin,{
    model : 'Ride',
    field : 'rideId',
    startAt : 1000,
    incrementBy : 1 
});

module.exports = mongoose.model('Ride',rideSchema);