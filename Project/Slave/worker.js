const mongoose = require('mongoose');
const workers = require('./workers');
const zookeeper = require('node-zookeeper-client');
require('dotenv/config');

const worker = process.env.WORKER;
const name = process.env.WNAME;
const connection = mongoose.connection;
const client = zookeeper.createClient(process.env.ZPATH);

mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

client.connect();

function createNode(nodepath, name, type){
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
    });
}

// checking if connection established
connection.once('open', () => {
    console.log('Connection Established with Mongo');
    client.once("connected", () => {
        console.log("Starting worker");
        createNode('/workers', '', zookeeper.CreateMode.PERSISTENT);
        createNode('/workers/master', '', zookeeper.CreateMode.PERSISTENT);
        createNode('/workers/slaves','', zookeeper.CreateMode.PERSISTENT);
        if (worker == 'MASTER') {
            console.log("Entering write");
            createNode('/workers/master/', name, zookeeper.CreateMode.EPHEMERAL);
            workers.write();
        } else {
            console.log("Entering read");
            createNode('/workers/slaves/', name, zookeeper.CreateMode.EPHEMERAL);
            workers.read();
        }
    });    
});

