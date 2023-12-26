const MongoClient = require('mongodb').MongoClient

var coll; // Variable to store the collection

// Connect to the MongoDB server
MongoClient.connect('mongodb://127.0.0.1:27017')
    .then((client) => {
        db = client.db('proj2023MongoDB') // Database
        coll = db.collection('managers') // Collection
    })
    .catch((error) => {
        console.log(error.message)
    })

// Find all managers in the collection
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

// Find a manager by their ID in the collection
var findManagerById = function (mgrid) {
    return new Promise((resolve, reject) => {
        var cursor = coll.find({ "_id": mgrid })
        cursor.toArray()
            .then((documents) => {
                console.log(documents);

                // Return the documents if the manager was found, otherwise return an error
                if (documents.length > 0) {
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

// Add a manager to the collection
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

// Update a manager's salary in the collection
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
