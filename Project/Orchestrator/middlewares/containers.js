const Docker = require('dockerode');
//const zookeeper = require('node-zookeeper-client');
const zookeeper = require('node-zookeeper-client');
const fs = require('fs');
require('dotenv/config');

const docker = new Docker();
const path = process.env.DPATH;
const zoo = process.env.ZPATH;

const client = zookeeper.createClient(zoo);

client.connect();

//adding zookeeper functions
exports.createNode = (nodepath, name) => {
    console.log("create node called");
    let node = nodepath + name;
    client.create(node, Buffer.from(node), (err, path) => {
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

exports.deleteNode = (nodepath, name) => {
    console.log('delete node called on');
    let node = nodepath + name;
    console.log(node);
    client.remove(node, -1, (err) => {
        if (err) {
            console.log("Error deleting");
            console.log(err.stack);
        } else {
            console.log("Successfully removed");
        }
    });
}

// working function TODO use SetInterval to call this function
exports.createMongoContainer = async (mongoName, masterMongo) => {
    // create mongo image
    let model = {
        Image: 'mongo',
        Hostname: mongoName,
        name: mongoName,
        HostConfig: {
            NetworkMode: "project_default"
        }
    }
    let command = `mongodump --host ${masterMongo} --port 27017 && mongorestore --host ${mongoName} --port 27017`;

    docker.createContainer(model).then((container) => {
        console.log("Container created");
        container.start(() => {
            console.log("container started");
            container.exec({
                Cmd: ['bash', '-c', command]
            }, (err, exec) => {
                if (!err) {
                    console.log("Command created");
                    exec.start((err, data) => {
                        if (!err) {
                            console.log("Command successfully executed");
                        }
                    })
                } else {
                    console.log(err);
                }

            });
        });
        //console.log("Container started");
    }).catch((err) => {
        console.log(err);
    });
};

exports.createSlaveContainer = async (slaveName, mongoName) => {
    // create slave container image
    let model = {
        Image: 'slave:latest',
        Hostname: slaveName,
        name: slaveName,
        Cmd: "worker.js",
        Env: ["WORKER=SLAVE", "DB_CONNECTION=mongodb://" + mongoName + ":27017", "RMQ_ADDR=amqp://rabbitmq"],
        HostConfig: {
            NetworkMode: "project_default"
        }
    }
    let constants = await JSON.parse(fs.readFileSync(path))
    docker.createContainer(model).then((container) => {
        console.log("Container created");
        container.start(() => {
            console.log("container started");
            container.inspect((err, data) => {
                if (err) {
                    console.log("Error inspection");
                    console.log(err);
                } else {
                    console.log("Data");
                    console.log(data.State.Pid);
                    name = data.Name.substr(1);
                    pid = data.State.Pid;
                    constants.containers[name] = pid;
                    fs.writeFileSync(path, JSON.stringify(constants));
                    this.createNode(slaveName);
                }
            });
        });
    }).catch((err) => {
        console.log("Error creating container");
        console.log(err);
    });

};

exports.createContainers = async (diff, total, masterMongo) => {

    for (let i = 1; i <= diff; i++) {
        let num = total + i;
        let mongoName = 'smongo_' + num.toString();
        let slaveName = 'slave_' + num.toString();
        try {
            await this.createMongoContainer(mongoName, masterMongo);
            await this.createSlaveContainer(slaveName, mongoName);
        } catch (err) {
            console.log("Error in creation");
            console.log(err);
        }

    }

};

exports.deleteContainer = (name, option) => {
    console.log("deleting container");
    if (option === 'kill') {
        docker.getContainer(name).kill((err, data) => {
            console.log("Container killed");
        });

    } else if (option === 'rm') {
        docker.getContainer(name).remove({ force: true }, (err, data) => {
            if (!err) {
                console.log("Container removed");
                console.log(data);
            }
        });
    } else if (option === 'stop') {
        docker.getContainer(name).stop((err => {
            if(!err) {
                console.log("container stopped");
            } else {
                console.log("Error in stopping");
                console.log(err);
            }
        }))
    }
}

// if races occur use async-lock
exports.deleteSlaveContainers = async (option) => {
    let hpid = Number.MIN_VALUE;
    let containerName;
    let constants = await JSON.parse(fs.readFileSync(path));
    let entries = Object.entries(constants.containers);
    for (const [cname, pid] of entries) {
        if (pid > hpid) {
            hpid = pid;
            containerName = cname;
        }
    }
    delete constants.containers[containerName];
    fs.writeFileSync(path, JSON.stringify(constants));
    this.deleteContainer(containerName, option);
    let mongoName = 'smongo_' + containerName.split('_')[1];
    this.deleteContainer(mongoName, option);
    return hpid;
}

exports.deleteMultiContainers = (diff) => {
    for (let i = 0; i < diff; i++) {
        this.deleteSlaveContainers('stop');
    }
};

exports.timer = async () => {
    let constants = await JSON.parse(fs.readFileSync(path));
    let slaves = Math.ceil(constants.count / 20);
    slaves = slaves > 0 ? slaves : 1;
    let diff = slaves - constants.slaves;
    if (diff < 0) {
        this.deleteMultiContainers(Math.abs(diff));
    } else if (diff > 0) {
        this.createContainers(diff, constants.total, constants.masterMongo);
        constants.total += diff;
    }
    constants.count = 0;
    constants.slaves = slaves;
    fs.writeFileSync(path, JSON.stringify(constants));
}

exports.updateCount = async (req, res, next) => {
    let constants = await JSON.parse(fs.readFileSync(path));
    constants.count++;
    if (constants.isFirst) {
        setInterval(this.timer, 120000);
        constants.isFirst = false;
    }
    fs.writeFileSync(path, JSON.stringify(constants));
    next();
};
// TODO add updateCount in the right place

exports.getWorkerPids = () => {
    const pids = [];
    let constants = fs.readFileSync(path);
    constants = JSON.parse(constants);
    pids.push(constants.masterPid);
    let entries = Object.entries(constants.containers);
    for (const [cname, pid] of entries) {
        pids.push(pid);
    }
    return pids;
}

exports.startSetUp = (constants) => {
    console.log("Start Up called");
    this.createNode('/workers', '', zookeeper.CreateMode.PERSISTENT);
    this.createNode('/workers/master', '', zookeeper.CreateMode.PERSISTENT);
    this.createNode('/workers/slaves','', zookeeper.CreateMode.PERSISTENT);
    docker.getContainer(constants.masterWorker).inspect((err, data) => {
        if (!err) {
            console.log("Master worker found");
            let pid = data.State.Pid;
            constants["masterPid"] = pid;
            setTimeout(this.getData, 10000, '/workers/master/master');
            //this.createNode('/workers/master/', constants.masterWorker, () => {console.log('lastest')});
            //this.createNode('/workers/master/', 'master2', () => {});
            docker.getContainer('slave_1').inspect((err, data) => {
                if (!err) {
                    console.log("slave worker found");
                    pid = data.State.Pid;
                    constants.containers['slave_1'] = pid;
                    fs.writeFileSync(path, JSON.stringify(constants));
                    //this.createNode('/workers/slaves/', 'slave_1');
                } else {
                    fs.writeFileSync(path, JSON.stringify(constants));
                }
            });
        } else {
            console.log(err);
        }
    });
}
exports.getData = (cpath) => {
    console.log("Get data called");
    client.getData(cpath, (event) => {
        console.log("Watcher");
        console.log(event);
    }, (err, data, stat) => {
        if(!err) {
            console.log("no error");
            console.log(data);
        } else {
            console.log("get data error");
            console.log(err);
        }
    })
}

exports.initialSetUp = async () => {
    console.log("initial setup");
    let constants = await JSON.parse(fs.readFileSync(path));
    client.once('connected', () => {
        console.log("Connection with zoo successful");
        this.startSetUp(constants);
        /*setTimeout(this.deleteNode, 15000, '/workers/master/', 'master');
        setTimeout(this.deleteNode, 15000, '/workers/master', '');
        setTimeout(this.deleteNode, 15000, '/workers/slaves', '');
        setTimeout(this.deleteNode, 15000, '/workers', '');*/
    });
};
