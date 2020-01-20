// dependencies
const mongoose = require('mongoose');

// define the schema
const userSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    username : String,
    password : String,
    rides : Array
});

//export the schema
module.exports = mongoose.model('User',userSchema);

