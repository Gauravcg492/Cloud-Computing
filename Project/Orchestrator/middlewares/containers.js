// dependencies
const Docker = require('dockerode');
const zookeeper = require('node-zookeeper-client');
const fs = require('fs');
require('dotenv/config');

// variables
const docker = new Docker();
const path = process.env.DPATH;
const zoo = process.env.ZPATH;
const client = zookeeper.createClient(zoo, { sessionTimeout: 10000 });

// connect to zookeeper
client.connect();

// function to create zookeeper nodes 
exports.createNode = (nodepath, name) => {
    console.log("create node called");
    let node = nodepath + name;
    client.create(node, Buffer.from(node), (err, path) => {
        if (err) {
            if (err.code === -110) {
                console.log("Node exists ", node);
            } else {
                console.log('Error creating for path ', node);
                console.log(err);
            }
        } else {
            console.log("Node created at path: ", path);
        }
    });
};

// function to create mongo container
exports.createMongoContainer = async (mongoName, masterMongo, slaveName) => {
    // create mongo image
    let model = {
        Image: 'mongo',
        Hostname: mongoName,
        name: mongoName,
        HostConfig: {
            NetworkMode: "project_default"
        }
    }
    // command to update the slave db with master
    let command = `mongodump --host ${masterMongo} --port 27017 && mongorestore --host ${mongoName} --port 27017`;
    // create docker container (async)
    docker.createContainer(model).then((container) => {
        console.log("Container created");
        // start the containers
        container.start(() => {
            console.log("container started");
            // execute a command
            container.exec({
                Cmd: ['bash', '-c', command]
            }, (err, exec) => {
                if (!err) {
                    console.log("Command created");
                    exec.start((err, data) => {
                        if (!err) {
                            console.log("Command successfully executed");
                            // create the slave container and connect to mongoName
                            this.createSlaveContainer(slaveName, mongoName);
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

// function to create slave container
exports.createSlaveContainer = async (slaveName, mongoName) => {
    // create slave container image
    let model = {
        Image: 'slave:latest',
        Hostname: slaveName,
        name: slaveName,
        Cmd: "worker.js",
        Env: ["WORKER=MASTER", "DB_CONNECTION=mongodb://" + mongoName + ":27017", "RMQ_ADDR=amqp://rabbitmq", "ZPATH=zookeeper:2181", "WNAME=" + slaveName],
        HostConfig: {
            NetworkMode: "project_default"
        }
    }
    // read constants.json file to update the containers object with new slave name and pid
    let constants = await JSON.parse(fs.readFileSync(path))
    docker.createContainer(model).then((container) => {
        console.log("Container created");
        container.start(() => {
            console.log("container started");
            // inspect the container to obtain the pid of the container
            container.inspect((err, data) => {
                if (err) {
                    console.log("Error inspection");
                    console.log(err);
                } else {
                    console.log("Data");
                    console.log(data.State.Pid);
                    let name = data.Name.substr(1);
                    let pid = data.State.Pid;
                    constants.containers[name] = pid;
                    fs.writeFileSync(path, JSON.stringify(constants));
                    // attach the watcher event to the newly created container
                    setTimeout(this.getData, 10000, '/workers/master/' + name);
                }
            });
        });
    }).catch((err) => {
        console.log("Error creating container");
        console.log(err);
    });
};

// fucntion which creates diff number of container by calling the above defined function
exports.createContainers = async (diff, total, masterMongo) => {

    for (let i = 1; i <= diff; i++) {
        let num = total + i;
        let mongoName = 'smongo_' + num.toString();
        let slaveName = 'slave_' + num.toString();
        try {
            this.createMongoContainer(mongoName, masterMongo, slaveName);
        } catch (err) {
            console.log("Error in creation");
            console.log(err);
        }

    }

};

// function to delete the worker container 
/*
* Option
* rm : remove the container
* kill : crash the container
* stop : stop the container
*/
exports.deleteContainer = (name, option) => {
    console.log("deleting container");
    if (option === 'kill') {
        docker.getContainer(name).kill((err, data) => {
            if (!err) {
                console.log("Container killed");
            } else {
                console.log("Container kill error");
                console.log(err);
            }
        });

    } else if (option === 'rm') {
        docker.getContainer(name).remove({ force: true }, (err, data) => {
            if (!err) {
                console.log("Container removed");
                console.log(data);
            } else {
                console.log("Container remove error");
                console.log(err);
            }
        });
    } else if (option === 'stop') {
        docker.getContainer(name).stop((err => {
            if (!err) {
                console.log("container stopped");
            } else {
                console.log("Container stop error");
                console.log(err);
            }
        }))
    }
};

// function which call the above function for both the mongo and worker container
exports.deleteContainers = async (containerName, option, update) => {
    let mongoName = ""
    if (containerName.startsWith("slave")) {
        if (update) {
            let constants = await JSON.parse(fs.readFileSync(path));
            delete constants.containers[containerName];
            fs.writeFileSync(path, JSON.stringify(constants));
        }
        mongoName = 'smongo_' + containerName.split('_')[1];
    } else {
        let constants = await JSON.parse(fs.writeFileSync(path));
        mongoName = constants.masterMongo;
    }

    this.deleteContainer(containerName, option);
    this.deleteContainer(mongoName, option);
};

// function which checks for which slave container to delete
exports.deleteSlaveContainers = async (option) => {
    let hpid = Number.MIN_VALUE;
    let containerName;
    // get container and their pids from the constants.json file
    let constants = await JSON.parse(fs.readFileSync(path));
    let entries = Object.entries(constants.containers);
    for (const [cname, pid] of entries) {
        if (pid > hpid) {
            hpid = pid;
            containerName = cname;
        }
    }
    this.deleteContainers(containerName, option, true);
    return hpid;
};

// functions which calls the above function diff number of times
exports.deleteMultiContainers = (diff) => {
    for (let i = 0; i < diff; i++) {
        this.deleteSlaveContainers('stop');
    }
};

// function which is called every 2 minutes which does scale in/out
exports.timer = async () => {
    // calculate how many slaves to create/delete
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
};

// function which increments the count variable and writes it to constants.json file
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

// function to get the pids of all the worker containers (uses constants.json file)
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
};

// initial set up to  create nodes
exports.startSetUp = (constants) => {
    console.log("Start Up called");
    this.createNode('/workers', '', zookeeper.CreateMode.PERSISTENT);
    this.createNode('/workers/master', '', zookeeper.CreateMode.PERSISTENT);
    this.createNode('/workers/slaves', '', zookeeper.CreateMode.PERSISTENT);
    // inspect the master and slave container for their pids
    docker.getContainer(constants.masterWorker).inspect((err, data) => {
        if (!err) {
            console.log("Master worker found");
            let pid = data.State.Pid;
            constants["masterPid"] = pid;
            // attach the watcher event to master znode
            setTimeout(this.getData, 10000, '/workers/master/master');
            docker.getContainer('slave_1').inspect((err, data) => {
                if (!err) {
                    console.log("slave worker found");
                    pid = data.State.Pid;
                    constants.containers['slave_1'] = pid;
                    fs.writeFileSync(path, JSON.stringify(constants));
                    // attach the watcher event to slave znode
                    setTimeout(this.getData, 10000, '/workers/slaves/slave_1');
                } else {
                    fs.writeFileSync(path, JSON.stringify(constants));
                }
            });
        } else {
            console.log(err);
        }
    });
};

exports.electMaster = (constants) => {
    let lpid = Number.MAX_VALUE;
    let containerName = "";
    let entries = Object.entries(constants.containers);
    for (const [cname, pid] of entries) {
        if (pid < hpid) {
            hpid = pid;
            containerName = cname;
        }
    }
    return containerName;
};

// function which is called by the watcher event which create a new slave in its place
exports.maintainAvailability = async (workerName) => {
    let constants = await JSON.parse(fs.readFileSync(path));
    console.log("Availability called");
    if (workerName.startsWith("slave")) {
        console.log("Slave Crashed");
        this.deleteContainers(workerName, 'rm', false);
        this.createContainers(1, constants.total, constants.masterMongo);
        delete constants.containers[workerName];
    } else {
        console.log("Master Crashed");
        // TODO master election
        this.deleteContainers(workerName, 'rm', false);
        let masterName = this.electMaster(constants);
    }
    constants.total += 1; 
    fs.writeFileSync(path, JSON.stringify(constants));
};

// function which attaches the watcher event to the node path specified 
exports.getData = (cpath) => {
    console.log("Get data called, for path ", cpath);
    client.getData(cpath, (event) => {
        console.log("Watcher called for ", event);
        try {
            let workerName = event.path.split('/')[3];
            // inspect the container which caused the event
            docker.getContainer(workerName).inspect((err, data) => {
                if (!err) {
                    console.log("No Error during inspection");
                    let exitCode = data.State.ExitCode;
                    console.log(exitCode);
                    //console.log(data);
                    // check if it was a crash or stopped
                    if (exitCode === 137 || exitCode === 139) {
                        // create new container
                        this.maintainAvailability(workerName);
                    } else if (exitCode === 143) {
                        this.deleteContainers(workerName, 'rm', false);
                        //this.deleteContainer(workerName, 'rm');
                    }
                } else {
                    console.log("Inspection Error");
                    console.log(err);
                }
            });
        } catch (err) {
            console.log("Error during splice");
            console.log(err);
        }
        //console.log(event);
    }, (err, data, stat) => {
        if (!err) {
            console.log("no error");
            console.log(data);
        } else {
            console.log("get data error");
            console.log(err);
        }
    })
};

// first function called by the orchestrator to initialze
exports.initialSetUp = async () => {
    console.log("initial setup");
    let constants = await JSON.parse(fs.readFileSync(path));
    client.once('connected', () => {
        console.log("Connection with zoo successful");
        this.startSetUp(constants);
    });
};
