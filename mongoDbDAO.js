const MongoClient = require('mongodb').MongoClient

var coll;

MongoClient.connect('mongodb://127.0.0.1:27017')
    .then((client) => {
        db = client.db('proj2023MongoDB')
        coll = db.collection('managers')
    })
    .catch((error) => {
        console.log(error.message)
    })


var findAllManagers = function () {
    return new Promise((resolve, reject) => {
        var cursor = coll.find()
        cursor.toArray()
            .then((documents) => {
                resolve(documents)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

var findManagerById = function (mgrid) {
    return new Promise((resolve, reject) => {
        var cursor = coll.find({"_id": mgrid})
        cursor.toArray()
            .then((documents) => {
                console.log(documents);
                if (documents.length > 0) {
                    console.log("Found");
                    resolve(documents);
                } else {
                    reject(new Error("Manager not found"));
                }
            })
            .catch((error) => {
                reject(error)
            })
    })
}

var addManager = function (manager) {
    return new Promise((resolve, reject) => {
        coll.insertOne(manager)
            .then((documents) => {
                resolve(documents)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

var updateManager = function (manager) {
    return new Promise((resolve, reject) => {
        coll.updateOne({ _id: manager._id }, { $set: { salary: manager.salary } })
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
};



module.exports = { findAllManagers, findManagerById, addManager, updateManager }
