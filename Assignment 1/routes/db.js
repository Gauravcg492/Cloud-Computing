// dependencies
const express = require('express');
const User = require('../models/user');

// variables
const router = express.Router();

// 8. Write to db
router.post('/write', async (req, res, next) => {
    /*console.log('db/write called');
    res.status(200).json({
        something : 'something'
    });*/
    const action = req.body.action;
    const table = req.body.table;

    // if action is 1 create user
    if (action == 1) {
        if (table === 'user') {
            const user = new User({
                username: req.body.values[0],
                password: req.body.values[1],
                rides: req.body.values[2]
            });
            console.log(user);
            try {
                const savedUser = await user.save();
                console.log(savedUser);
                res.json({
                    statusCode: 201
                });
            } catch (err) {
                console.log(err);
                res.json({
                    statusCode: 500
                });
            }

        }
    } else if(action == 2){
        if(table === 'user'){
            try{
                const response = await User.deleteOne(req.body.where);
                console.log(response);
                res.status(200).json({});
            } catch{
                const error = new Error('400 Bad Request');
                error.status = 400;
                next(error);
            }
        }
    }
});

// 9. Read from db
router.post('/read', async (req, res, next) => {

    const table = req.body.table;

    if (table === "user") {
        console.log('Reading db');
        try{
            var result = await User.findOne(req.body.where);
            console.log(result.username);
            res.status(200).json({
                statusCode : 200
            });
        } catch(err){
            next(err);
        }
    }

});

//
module.exports = router;