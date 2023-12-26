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

app.get('/products', (req, res) => {

    mySQLDAO.getProducts()
        .then((data) => {
            console.log(data);
            res.render("products", { "productData": data});
        })
        .catch((error) => {
            res.send(error);
        })
})

app.get('/store/add', (req, res) => {
    res.render("addStore", { "errorMessage": "" })
})

app.get('/store/edit/:sid', async (req, res) => {

    await renderEditStorePage(req.params.sid, res, "");
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
        renderEditStorePage(req.params.sid, res, errorMessage);
    }
})

app.get('/products/delete/:pid', (req, res) => {
    mySQLDAO.deleteProduct(req.params.pid)
    .then((data) => {
        res.redirect('/');
    })
    .catch((error) => {
       res.render("deleteError", {"pid": req.params.pid});
    })
})

app.post('/managers/add', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";
    let mgrid = req.body.mgrid;

    if ((mgrid).length != 4) {
        errorMessage = "Error - Manager ID must be four characters in length";
    }
    else if ((req.body.name).length <= 5) {
        errorMessage = "Error - Name must be greater than five characters in length";
    }
    else if(req.body.salary <= 30000 || req.body.salary >= 70000)
    {
        errorMessage = "Error - Salary bust be between 30,000 and 70,000";
    }
    else {
        await myMongoDbDAO.addManager({
            _id: req.body.mgrid,
            name: req.body.name,
            salary: req.body.salary
        })
            .then(() => {
                res.redirect("/managers");
            })
            .catch((error) => {
                if (error.message.includes("E11000")) {
                    error = true;
                    errorMessage = "Error - Manager: " + mgrid + " already exists in MongoDB";
                }
            })
    }

    if (error == true) {
        res.render("addManager", { "errorMessage": errorMessage });
    }
})

app.get('/managers/edit/:mgrid', async (req, res) => {

    await renderEditManagerSalaryPage(req.params.mgrid, res, "");
})

app.post('/managers/edit/:mgrid', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";

    if(req.body.salary <= 30000 || req.body.salary >= 70000)
    {
        errorMessage = "Error - Salary bust be between 30,000 and 70,000";
    }
    else {
        await myMongoDbDAO.updateManager({
            _id: req.body.mgrid,
            salary: req.body.salary
        })
            .then(() => {
                res.redirect("/managers");
            })
            .catch((error) => {
                console.log(error);
            })
    }

    if (error == true) {
        renderEditManagerSalaryPage(req.params.mgrid, res, errorMessage);
    }
})


app.get('/products', (req, res) => {

    res.render("products");
})

app.get('/managers', (req, res) => {

    res.render("managers");
})

app.get('/managers/add', (req, res) => {
    res.render("addManager", { "errorMessage": "" })
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
        .catch(() => {
            storeData = [];
        })

    return storeData;
}

async function getManagerById(mgrid) {

    let managerData;

    await myMongoDbDAO.findManagerById(mgrid)
        .then((data) => {
            managerData = data;
        })
        .catch(() => {
            managerData = [];
        })

    return managerData;
}

async function renderEditStorePage(sid, res, errorMessage) {
    let storeData = await getStoreById(sid);

    if (storeData.length > 0) {
        console.log("Store data: " + storeData[0].location);
        res.render("editStore", { "errorMessage": errorMessage, "storeData": storeData[0] });
    }
    else {
        res.send("An unexpected error has occured");
    }
}

async function renderEditManagerSalaryPage(mgrid, res, errorMessage) {
    let managerData = await getManagerById(mgrid);

    if (managerData.length > 0) {
        res.render("editManagerSalary", { "errorMessage": errorMessage, "managerData": managerData[0] });
    }
    else {
        res.send("An unexpected error has occured");
    }
}