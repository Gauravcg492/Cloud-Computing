// dependencies
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

// initialize incrementor
autoIncrement.initialize(mongoose.connection);

// define the schema
const userSchema = mongoose.Schema({
    userId : {
        type : Number
    },
    username : {
        type : String,
        unique : true,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    rides : Array
});

// use autoincrement
userSchema.plugin(autoIncrement.plugin,{
    model : 'User',
    field : 'userId',
    startAt : 1000,
    incrementBy : 1
});

//export the schema
module.exports = mongoose.model('User',userSchema);

