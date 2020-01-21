// dependencies
const mongoose = require('mongoose');

// define the schema
const userSchema = mongoose.Schema({
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

//export the schema
module.exports = mongoose.model('User',userSchema);

