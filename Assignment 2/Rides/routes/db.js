// dependencies
const express = require('express');
const Ride = require('../models/ride');

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

    // if action is 1 create
    if (action == 1) {
        if (table === 'ride') {
            const ride = new Ride({
                created_by: req.body.values[0],
                timestamp: req.body.values[1],
                source: req.body.values[2],
                destination: req.body.values[3],
                users: req.body.values[4]
            });
            try {
                console.log('Saving ride details');
                const savedRide = await ride.save();
                console.log(savedRide);
                res.json({
                    statusCode: 201
                });
            } catch (err) {
                console.log('Inside ride of db');
                console.log(err);
                res.json({
                    statusCode : 500
                });
            }
        }
    } else if (action == 2) {
        if(table == 'ride')
        {
            try {
                const response = await Ride.deleteOne(req.body.where);
                console.log(response);
                if(response.deletedCount > 0){
                    res.status(200).json({
                        statusCode : 200
                    });
                }  else{
                    res.status(200).json({
                        statusCode : 400
                    });
                } 
            } catch (err) {
                console.log('Inside action 2 user db');
                console.log(err);
                res.status(400).json({
                    statusCode : 400
                });
            }
        }
    } else if(action == 6){
        if(table == 'ride'){
            try{
                const response = await Ride.updateOne(req.body.where,{ $addToSet : {users : req.body.users}});
                console.log(response);
                if(response.nModified == 0){
                    res.json({
                        statusCode : 400
                    });
                }else{
                    res.status(200).json({
                        statusCode : 200
                    });
                }                
            } catch(err){
                console.log(err);
                res.status(400).json({
                    statusCode : 400
                });
            }
        }
    }
});

// 9. Read from db
router.post('/read', async (req, res, next) => {

    const table = req.body.table;
    const action = req.body.action;
    

    if (table == 'ride') {
        const action = req.body.action;
        console.log('Ride db read');
        var result;
        try {
            if(action == 2){
                result = await Ride.find(req.body.where);
            }
            if(action == 4){
                result = await Ride.find(req.body.where).select('rideId created_by timestamp -_id');
            }
            if(action == 5){
                result = await Ride.findOne(req.body.where).select('-_id -__v');
            }            
            console.log(result);
            res.status(200).json(result);
        } catch (err) {
            console.log(err);
            res.status(200).json({
                statusCode : 400
            });
        }
    }

});

router.post('clear',async (req,res,next) => {
    console.log("Clearing db");
    try{
        var result = await Ride.remove({});
        res.status(200).json({});
        console.log("success");
    }
    catch{
        res.status(400).json({});
        console.log("Failure");
    }
});

router.use((req,res,next) => {
    res.status(405).json({});
});

//
module.exports = router;
