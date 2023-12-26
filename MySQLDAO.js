var pmysql = require('promise-mysql')
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

var pool;

pmysql.createPool({
    connectionLimit: 3,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'proj2023'
})
    .then(p => {
        pool = p
    })
    .catch(e => {
        console.log("pool error:" + e)
    })

// Retrieve all stores from the database
var getStores = function () {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM store')
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })
    })
}

// Find a store by its SID
var findStoreById = function (sid) {
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: 'Select * from store where sid = ?',
            values: [sid]
        }
        pool.query(myQuery)
            .then((data) => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            })
    })
}

// Add a new store to the database
var addStore = function (sid, location, mgrid) {
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: 'INSERT INTO store VALUES (?, ?, ?)',
            values: [sid, location, mgrid]
        }
        pool.query(myQuery)
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })
    })
}

// Edit the details of an existing store
var editStore = function (sid, location, mgrid) {
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: 'UPDATE store SET location = ?, mgrid = ? WHERE sid = ?;',
            values: [location, mgrid, sid]
        }
        pool.query(myQuery)
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })
    })

}

// Find a manager by their Manager ID
var findManagerById = function (mgrid) {
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: 'SELECT * FROM store where mgrid = ?',
            values: [mgrid]
        }
        pool.query(myQuery)
            .then((data) => {

                // Return the data if the manager was found, otherwise return an error
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject(new Error("Manager not found"));
                }
            })
            .catch(error => {
                reject(error);
            })
    })
}

// Retrieve all products from the database
var getProducts = function () {
    return new Promise((resolve, reject) => { // Join product onto product_store and onto store
        pool.query('SELECT product.pid, product.productdesc, product.supplier, product_store.sid, product_store.Price, store.sid AS store_sid, store.location, store.mgrid  FROM product  LEFT OUTER JOIN product_store ON product.pid = product_store.pid  LEFT OUTER JOIN store ON product_store.sid = store.sid  ORDER BY product.pid;')
            .then((data) => {
                resolve(data);
            })
            .catch(error => {
                reject(new Error("Product exists in stores"));
            });
    });
};

// Delete a product by its ID
var deleteProduct = function (pid) {
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: 'Delete from product where pid = ?',
            values: [pid]
        }
        pool.query(myQuery)
            .then((data) => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            })
    })

}


module.exports = { getStores, addStore, findManagerById, findStoreById, editStore, getProducts, deleteProduct }