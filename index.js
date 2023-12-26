var express = require('express')
var app = express()
var express = require('express')
var mySQLDAO = require('./MySQLDAO')
var myMongoDbDAO = require('./mongoDbDAO')

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

app.set('view engine', 'ejs')

// Home route
app.get('/', (req, res) => {

    res.render("home");
})

// Stores route
app.get('/stores', (req, res) => {

    mySQLDAO.getStores()
        .then((data) => {
            console.log(data);
            res.render("stores", { "stores": data }); // Render the stores page and pass the data returned by MySQL
        })
        .catch((error) => {
            console.log(error);
        })
})


// Add store route for GET
app.get('/store/add', (req, res) => {
    res.render("addStore", { "errorMessage": "" })
})

// Add store route for POST
app.post('/store/add', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";
    let mgrid = req.body.mgrid;

    // Set error message if there is an error or add a store if there are no errors
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

    // Display current page with the appropiate error message if there was an error
    if (error == true) {
        res.render("addStore", { "errorMessage": errorMessage }); // Render the Add Store page and the appropriate error message
    }
})

// Edit store route for GET
app.get('/store/edit/:sid', async (req, res) => {

    await renderEditStorePage(req.params.sid, res, "");
})

// Edit store route for POST
app.post('/store/edit/:sid', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";
    let mgrid = req.body.mgrid;

    // Set error message if there is an error or edit the store if there are no errors
    if ((mgrid).length != 4) {
        errorMessage = "Error - Manager ID must be four characters in length";
    }
    else if ((req.body.location).length < 1) {
        errorMessage = "Error - Location must be at least one characters in length";
    }
    // Do not check if manager is managing another store if manager is managing the current store
    else if (await getManagerIdOfStore(req.body.sid) != mgrid && await checkIfManagerIsManagingAStore(mgrid) == true) {
        errorMessage = "Error - Manager: " + mgrid + " is already managing another store";
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

                if (error.errno == "1062") { // Error code if store id already exists in the database
                    errorMessage = "Error - SID already exists";
                }
            })
    }

    // Display current page with the appropiate error message if there was an error
    if (error == true) {
        renderEditStorePage(req.params.sid, res, errorMessage); // Render the Edit Store page and the appropriate error message
    }
})

// Products route
app.get('/products', (req, res) => {

    mySQLDAO.getProducts()
        .then((data) => {
            console.log(data);
            res.render("products", { "productData": data });
        })
        .catch((error) => {
            res.send(error);
        })
})

// Delete product route
app.get('/products/delete/:pid', (req, res) => {
    mySQLDAO.deleteProduct(req.params.pid)
        .then(() => {
            res.redirect('/');
        })
        .catch((error) => {
            console.log(error);
            res.render("deleteError", { "pid": req.params.pid });
        })
})

// Managers route
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

// Add manager route for GET
app.get('/managers/add', (req, res) => {
    res.render("addManager", { "errorMessage": "" })
})

// Add manager route for POST
app.post('/managers/add', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";
    let mgrid = req.body.mgrid;

    // Set error message if there is an error or add a manager if there are no errors
    if ((mgrid).length != 4) {
        errorMessage = "Error - Manager ID must be four characters in length";
    }
    else if ((req.body.name).length <= 5) {
        errorMessage = "Error - Name must be greater than five characters in length";
    }
    else if (req.body.salary <= 30000 || req.body.salary >= 70000) {
        errorMessage = "Error - Salary must be between 30,000 and 70,000";
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
                if (error.message.includes("E11000")) { // Error code if manager id already exists in the database
                    error = true;
                    errorMessage = "Error - Manager: " + mgrid + " already exists in MongoDB";
                }
            })
    }

    // Display current page with the appropiate error message if there was an error
    if (error == true) {
        res.render("addManager", { "errorMessage": errorMessage }); // Render the Add Manager Store page and the appropriate error message
    }
})

// Edit manager route for GET
app.get('/managers/edit/:mgrid', async (req, res) => {

    await renderEditManagerSalaryPage(req.params.mgrid, res, "");
})

// Edit manager route for POST
app.post('/managers/edit/:mgrid', async (req, res) => {
    let error = true;
    let errorMessage = "An unexpected error has occured";

    // Set error message if there is an error or edit the manager if there are no errors
    if (req.body.salary <= 30000 || req.body.salary >= 70000) {
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

    // Display current page with the appropiate error message if there was an error
    if (error == true) {
        renderEditManagerSalaryPage(req.params.mgrid, res, errorMessage); // Render the Edit Manager page and the appropriate error message
    }
})

// Start the server on port 3000
app.listen(3000, () => {
    console.log("Listening on port 3000");
});

// Check MySQL Database to find if a manager is managing another store
async function checkIfManagerIsManagingAStore(mgrid) {

    let managerManagingAnotherStore = false;

    await mySQLDAO.findManagerById(mgrid)
        .then(() => {
            console.log("Manager manages another store");
            managerManagingAnotherStore = true;
        })
        .catch((error) => {
            console.log(error);
        })

    return managerManagingAnotherStore;
}

// Check MongpDB Database to find if a manager exists
async function checkIfManagerExists(mgrid) {

    let managerExists = false;

    await myMongoDbDAO.findManagerById(mgrid)
        .then(() => {
            managerExists = true;
        })
        .catch((error) => {
            console.log(error);
        })

    return managerExists;
}

// Retrieve store data from the MySQL Database by its Store ID
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

// Retrieve manager data from the MongoDB database by its Manager ID
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

// Render the edit store page
async function renderEditStorePage(sid, res, errorMessage) {
    let storeData = await getStoreById(sid);

    // Display the page if storeData is not empty
    if (storeData.length > 0) {
        console.log("Store data: " + storeData[0].location);
        res.render("editStore", { "errorMessage": errorMessage, "storeData": storeData[0] });
    }
    else {
        res.send("An unexpected error has occured");
    }
}

// Render the edit manager salary page
async function renderEditManagerSalaryPage(mgrid, res, errorMessage) {
    let managerData = await getManagerById(mgrid);

    // Display the page if managerData is not empty
    if (managerData.length > 0) {
        res.render("editManagerSalary", { "errorMessage": errorMessage, "managerData": managerData[0] });
    }
    else {
        res.send("An unexpected error has occured");
    }
}

// Gets the Manager ID of a store based on the the store's Store ID
async function getManagerIdOfStore(sid) {

    let storeData = await getStoreById(sid);

    console.log(storeData[0].mgrid);

    return storeData[0].mgrid;
}