var express = require('express')
var app = express()
var express = require('express')
var mySQLDAO = require('./MySQLDAO')

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

app.set('view engine', 'ejs')


app.get('/', (req, res) => {

    res.render("home");
})

app.get('/stores', (req, res) => {

    mySQLDAO.getStores()
        .then((data) => {
            res.render("stores", {"stores":data});
            console.log(data);
        })
        .catch((error) => {
            console.log(error);
        })
})

app.get('/products', (req, res) => {

    res.render("products");
})

app.get('/managers', (req, res) => {

    res.render("managers");
})

app.listen(3004, () => {
    console.log("Listening on port 3004");
});