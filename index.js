var express = require('express')
var app = express()
var express = require('express')
var mySQLDAO = require('./MySQLDAO')
var myMongoDbDAO = require('./mongoDbDAO')

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

app.set('view engine', 'ejs')


app.get('/', (req, res) => {

    res.render("home");
})

app.get('/stores', (req, res) => {

    mySQLDAO.getStores()
        .then((data) => {
            console.log(data);
            res.render("stores", { "stores": data });
        })
        .catch((error) => {
            console.log(error);
        })
})

app.get('/managers', (req, res) => {

    myMongoDbDAO.findAllManagers()
        .then((documents) => {
            console.log(documents);
            res.render("managers", { "managers": documents });
        })
        .catch((error) => {
            console.group(error);
            res.send(error);
        })
})

app.get('/store/add', (req, res) => {
    res.render("addStore", { "errorMessage": "" })
})

app.get('/store/edit/:sid', async (req, res) => {

    await renderEditPage(req.params.sid, res, "");
})

app.post('/store/add', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";
    let mgrid = req.body.mgrid;

    if ((req.body.sid).length != 5) {
        errorMessage = "Error - SID must be five characters in length";
    }
    else if ((mgrid).length != 4) {
        errorMessage = "Error - Manager ID must be four characters in length";
    }
    else if ((req.body.location).length < 1) {
        errorMessage = "Error - Location must be at least one characters in length";
    }
    else if (await checkIfManagerIsManagingAStore(mgrid) == true) {
        errorMessage = "Error - Manager: " + mgrid + " is already managing another store";
    }
    else if (await checkIfManagerExists(mgrid) == false) {
        errorMessage = "Error - Manager: " + mgrid + " does not exist";
    }
    else {
        await mySQLDAO.addStore(req.body.sid, req.body.location, mgrid)
            .then(() => {
                error = false;
                res.redirect("/stores");
            })
            .catch((error) => {

                if (error.errno == "1062") {
                    errorMessage = "Error - SID already exists";
                }
            })
    }

    if (error == true) {
        res.render("addStore", { "errorMessage": errorMessage });
    }
})

app.post('/store/edit/:sid', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";
    let mgrid = req.body.mgrid;
    console.log("2");

    if ((mgrid).length != 4) {
        errorMessage = "Error - Manager ID must be four characters in length";
    }
    else if ((req.body.location).length < 1) {
        errorMessage = "Error - Location must be at least one characters in length";
    }
    else if (await checkIfManagerIsManagingAStore(mgrid) == true) {
        errorMessage = "Error - Manager: " + mgrid + " is already managing another store";
        console.log("abc");
    }
    else if (await checkIfManagerExists(mgrid) == false) {
        errorMessage = "Error - Manager: " + mgrid + " does not exist";
    }
    else {
        await mySQLDAO.editStore(req.body.sid, req.body.location, mgrid)
            .then(() => {
                error = false;
                res.redirect("/stores");
            })
            .catch((error) => {

                if (error.errno == "1062") {
                    errorMessage = "Error - SID already exists";
                }
            })
    }

    console.log(errorMessage);
    if (error == true) {
        console.log("Error");
        renderEditPage(req.params.sid, res, errorMessage);
    }
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

async function checkIfManagerIsManagingAStore(mgrid) {

    let managerManagingAnotherStore = false;

    await mySQLDAO.findManagerById(mgrid)
        .then(() => {
            console.log("Manager manages another store");
            managerManagingAnotherStore = true;
        })
        .catch((error) => {
            console.log("Manager does not manage another store");
        })

    return managerManagingAnotherStore;
}

async function checkIfManagerExists(mgrid) {

    let managerExists = false;

    await myMongoDbDAO.findManagerById(mgrid)
        .then(() => {
            managerExists = true;
        })
        .catch((error) => {
            console.group(error);
        })

    return managerExists;
}

async function getStoreById(sid) {

    let storeData;

    await mySQLDAO.findStoreById(sid)
        .then((data) => {
            storeData = data;
        })
        .catch((error) => {
            storeData = [];
        })

    return storeData;
}

async function renderEditPage(sid, res, errorMessage)
{
    let storeData = await getStoreById(sid);

    if(storeData.length > 0)
    {
        console.log("Store data: " + storeData[0].location);
        res.render("editStore", { "errorMessage": errorMessage, "storeData": storeData[0]});
    }
    else
    {
        res.send("An unexpected error has occured");
    }
}