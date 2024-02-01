const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('./myKey.json');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { emit } = require('process');

const app = express();
const generateSecretKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const actualSecretKey = generateSecretKey();
const saltRounds = 10;
app.set('view engine', 'ejs');
app.use(
    session({
      secret: actualSecretKey,
      resave: false, // Set to true if you want to force the session to be saved back to the session store, even if the session was never modified during the request.
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, //24hours
      },
    })
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'views')));


app.get('/', (req, res) => {
    res.render('index');
});

app.get("/signup", (request, response) => {
    response.render("signup");
  });
  app.get("/signupngo", (request, response) => {
    response.render("signupngo");
  });

app.get("/login", (request, response) => {
    response.render("login");
  });

  app.get("/signout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            // Handle error
            console.error("Error destroying session:", err);
            res.status(500).send("Error signing out");
        } else {
            res.redirect("/");
        }
    });
});

app.post("/signupsubmit", function (req, res) {
    const { uname, email, password } = req.body;
    db.collection("admindetails")
      .where("email", "==", email)
      .get()    
      .then((docs) => {
        if (docs.size > 0) { 
          return res.send("Email already exists");
        }
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            console.error(err);
            return res.send("Failed to sign up");
          }  
          db.collection("adminDetails")
            .add({
              name: uname,
              email: email,
              password: hash, // Store the hashed password
            })
            .then(() => {
                res.redirect(`/provider?email=${encodeURIComponent(email)}`);
            })
            .catch((err) => {
              console.error(err);
              res.send("Failed to sign up");
            });
        });
      })
      .catch((err) => {
        console.error(err);
        res.send("Failed to sign up",err);
      });
});

app.post("/signupngosubmit", function (req, res) {
    const { uname, email, password } = req.body;
    db.collection("ngodetails")
      .where("email", "==", email)
      .get()    
      .then((docs) => {
        if (docs.size > 0) { 
          return res.send("Email already exists");
        }
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            console.error(err);
            return res.send("Failed to sign up");
          }  
          db.collection("ngoDetails")
            .add({
              name: uname,
              email: email,
              password: hash, // Store the hashed password
            })
            .then(() => {
                res.redirect(`/ngo?email=${encodeURIComponent(email)}`);
            })
            .catch((err) => {
              console.error(err);
              res.send("Failed to sign up");
            });
        });
      })
      .catch((err) => {
        console.error(err);
        res.send("Failed to sign up",err);
      });
});

app.post("/loginsubmit", function(req, res) {
    const { email, password } = req.body;

    db.collection('adminDetails')
        .where("email", "==", email)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                const user = docs.docs[0].data();
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.send("Failed");
                    }
                    if (result) {
                        // Redirect to /provider with email as a query parameter
                        res.redirect(`/provider?email=${encodeURIComponent(email)}`);
                    } else {
                        res.send("Failed");
                    }
                });
            } else {
                res.send("Failed");
            }
        })
        .catch((err) => {
            console.error(err);
            res.send("Failed");
        });
});

app.post("/admin_login", function(req, res) {
    const { email, password } = req.body;
    db.collection('ngoDetails')
        .where("email", "==", email)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                const user = docs.docs[0].data();
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.send("Failed");
                    }
                    if (result) {
                        // Redirect to /provider with email as a query parameter
                        res.redirect(`/ngo?email=${encodeURIComponent(email)}`);
                    } else {
                        res.send("Failed");
                    }
                });
            } else {
                res.send("Failed");
            }
        })
        .catch((err) => {
            console.error(err);
            res.send("Failed");
        });
});

app.get("/provider", function(req, res) {
    const email = req.query.email;
    db.collection('surplus')
        .where('owner', '==', email)
        .get()
        .then((snapshot) => {
            const surplusItems = [];
            snapshot.forEach((doc) => {
                surplusItems.push(doc.data());
            });
            res.render("providerDashboard", { email: email, surplusItems: surplusItems });
        })
        .catch((error) => {
            console.error('Error:', error);
            res.status(500).send('An error occurred.');
        });
});

app.get("/ngo", function(req, res) {
    const email = req.query.email;
    const providerdata = db.collection('surplus');

    // Retrieve all documents from the "bikes" collection
    providerdata.get()
        .then((querySnapshot) => {
            // Create an array to store the data
            const providerdocs = [];

            // Loop through each document in the collection
            querySnapshot.forEach((doc) => {
                // Get the document data
                const data = doc.data();
                
                // Push the data to the array
                providerdocs.push(data);
            });

            // Render the template with the email and providerdocs
            res.render("ngoDashboard", { email: email, providerdocs: providerdocs });
        })
        .catch((error) => {
            console.error('Error getting documents from "bikes" collection: ', error);
            // Handle the error and send an appropriate response
            res.status(500).send('Error getting data from "bikes" collection');
        });
});





app.post('/upload', (req, res) => {
    const { name, quantity,email, timeofcook, servecount, timein, timeout, location } = req.body;
    
    const docRef = db.collection('surplus').doc();
    const a = new Date().toISOString();
    const onlyIntegers = a.replace(/\D/g, '');
    docRef.set({
        name,
        quantity,
        timeofcook,
        servecount,
        timein,
        timeout,
        location,
        owner: email,
        surplusid: onlyIntegers
    })
    .then(() => {
    db.collection('surplus')
        .where('owner', '==', email)
        .get()
        .then((snapshot) => {
            const surplusItems = [];
            snapshot.forEach((doc) => {
                surplusItems.push(doc.data());
            });
            res.redirect(`/provider?email=${encodeURIComponent(email)}`);
        })
    })
    .catch((error) => {
        console.error('Error uploading JSON to Firebase:', error);
        res.status(500).send('Error uploading JSON to Firebase');
    });
});


app.get('/surplusItem', (req, res) => {
    const { email } = req.query; // Retrieve email from query parameters
    if (!email) {
        return res.status(400).send('Email is required');
    }

    db.collection('surplus')
        .where('owner', '==', email)
        .get()
        .then((snapshot) => {
            const surplusItems = [];
            snapshot.forEach((doc) => {
                surplusItems.push(doc.data());
            });
            res.send(surplusItems);
        })
        .catch((error) => {
            console.error('Error:', error);
            res.status(500).send('An error occurred.');
        });
});



app.delete('/surplusItems/:email', (req, res) => {
    const email = req.params.email;
    // Find the surplus food item based on its name
    db.collection('surplus')
        .where('owner', '==', email)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                console.log(snapshot);
                console.log('No matching documents.');
                return res.status(404).send('Surplus food item not found.');
            }

            // Assuming there's only one document matching the name
            const surplusFoodRef = snapshot.docs[0].ref;

            // Delete the surplus food item document
            return surplusFoodRef.delete();
        })
        .then(() => {
            res.status(200).send(`Surplus food item with owner ${email} deleted successfully.`);
        })
        .catch((error) => {
            console.error('Error deleting surplus food item:', error);
            res.status(500).send('Error deleting surplus food item.');
        });
});



app.post('/addSurplusFood', (req, res) => {
    // Handle adding surplus food
    console.log('Adding surplus food:', req.body);
    
    // Assuming you have a data structure to store surplus items, such as an array
    // You can store the added surplus food item in this array
    const newSurplusFood = {
        foodName: req.body.foodName,
        quantity: req.body.quantity,
        serving: req.body.serving,
        from: req.body.from,
        to: req.body.to
    };
    res.send(newSurplusFood);
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log(`Server is running at http://localhost:${3000}`);
});
