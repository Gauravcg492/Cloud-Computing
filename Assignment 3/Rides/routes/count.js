// dependencies
const express = require('express');
const fs = require('fs');

//variables
const router = express.Router();

// api to return count
router.get('/',async (req,res,next) => {
    try{
        const counts = JSON.parse(fs.readFileSync('../counts.json'));
        res.status(200).json(counts.count);

    }catch{
        console.log("Error reading file");
    }
});

// to reset count
router.delete('/', async (req,res) => {
    var counts = JSON.parse(fs.readFileSync('../counts.json'));
    counts.count = 0;
    fs.writeFileSync('../counts.json',JSON.stringify(counts));
    res.status(200).json();
});

// voiding bad requests
router.all('/', (req,res,next) => {
    res.status(405).json();
});


// export the router
module.exports = router