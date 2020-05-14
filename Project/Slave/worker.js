// dependencies
const mongoose = require('mongoose');
const workers = require('./workers');
const zookeeper = require('node-zookeeper-client');
require('dotenv/config');

// variables
const worker = process.env.WORKER;
const name = process.env.WNAME;
const connection = mongoose.connection;
const client = zookeeper.createClient(process.env.ZPATH, {sessionTimeout: 1000});

// connect to mongodb server
mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

// Function to create the node based on the name of the worker
async function createNode(nodepath, name, type, callback){
    console.log("create node called");
    //console.log(cbacks);
    let node = nodepath + name;
    client.create(node, Buffer.from(node), type, (err, path) => {
        if (err) {
            if(err.code === -110) {
                console.log("Node exists ", node);
            } else {
                console.log('Error creating for path ', node);
                console.log(err);
            }            
        } else {
            console.log("Node created at path: ", path);
        }
        callback();
    });
}

// A no operation function used to pass as callback
function noop() {
    console.log("No Op");
}

// checking if connection established with mongodb
connection.once('open', () => {
    console.log('Connection Established with Mongo');
    // start as soon as the worker is connected to zookeeper
    client.once("connected", async() => {
        console.log("Connected to zookeeper");
        // check/create the persistent, parent nodes
        createNode('/workers', '', zookeeper.CreateMode.PERSISTENT, noop);
        createNode('/workers/master', '', zookeeper.CreateMode.PERSISTENT, noop);
        createNode('/workers/slaves','', zookeeper.CreateMode.PERSISTENT, noop);
        if (worker == 'MASTER') {
            // Master section
            console.log("Entering write");
            // creating nodepath and passing it's main function as callback
            createNode('/workers/master/', name, zookeeper.CreateMode.EPHEMERAL, workers.write);
            //workers.write();
        } else {
            // Slave section
            console.log("Entering read");
            // creating nodepath and passing it's main function as callback
            createNode('/workers/slaves/', name, zookeeper.CreateMode.EPHEMERAL, workers.read);
            //workers.read();
        }
    });
    console.log(`Connecting to ${client}`);
    // connect to zookeeper
    client.connect();    
});

