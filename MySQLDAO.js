var pmysql = require('promise-mysql')
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))

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
                //console.log(error)
            })
    })
}

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
                //console.log(error)
            })
    })

}

var findManagerById = function (mgrid) {
    return new Promise((resolve, reject) => {
        var myQuery = {
            sql: 'SELECT * FROM store where mgrid = ?',
            values: [mgrid]
        }
        pool.query(myQuery)
            .then((data) => {
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

    

module.exports = { getStores, addStore, findManagerById, findStoreById, editStore }