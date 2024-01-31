const express = require('express');
const admin = require('firebase-admin');
const session = require('express-session');
const passwordHash = require('password-hash');

// Replace '/path/to/key.json' with the actual path to your key.json file
const serviceAccount = require('./key.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());

// Firebase Firestore instance
const db = admin.firestore();

// Generate a random secret key
const generateSecretKey = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
};

const actualSecretKey = generateSecretKey();

// Set up express-session middleware
app.use(
    session({
        secret: actualSecretKey,
        resave: false,
        saveUninitialized: true
    })
);

// Serve static files from a directory (e.g., HTML files)
app.use(express.static(__dirname));

app.set('view engine', 'ejs');

app.post('/upload', (req, res) => {
    const { name, quantity, timeOfCook, approxServing, slot } = req.body;

    // Create a new document in the 'surplus' collection
    const docRef = db.collection('surplusItems').doc();
    docRef
        .set({
            name,
            quantity,
            timeOfCook,
            approxServing,
            slot
        })
        .then(() => {
            res.status(200).send('JSON uploaded to Firebase successfully');
        })
        .catch((error) => {
            console.error('Error uploading JSON to Firebase:', error);
            res.status(500).send('Error uploading JSON to Firebase');
        });
});

app.post('/signin_verify', function (req, res) {
    var inputData = req.body;
    var name = inputData.name;
    var email = inputData.email;
    var password = passwordHash.generate(inputData.password);
    console.log(inputData)
    // Check if the email is already present in the Firestore collection
    db.collection('complaint')
        .where('Email', '==', email)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                // Email already exists, send a response indicating the user is already logged in
                res.status(500).send('already ');
            } else {
                // Email is not present, add data to the Firestore collection
                db.collection('complaint')
                    .add({
                        Name: name,
                        Email: email,
                        Password: password,
                    })
                    .then((docRef) => {
                        console.log('Document written with ID: ', docRef.id);
                        res.status(500).send('working existing email.');
                    })
                    .catch((error) => {
                        console.error('Error adding document: ', error);
                        res.status(500).send('An error occurred while adding the document.');
                    });
            }
        })
        .catch((error) => {
            console.error('Error checking for existing email: ', error);
            res.status(500).send('An error occurred while checking for existing email.');
        });
});

app.post('/request', (req, res) => { 
    var inputData = req.body;
    // var password = inputData.password;
    var email = inputData.email;
    db.collection('complaint')
      .where('Email', '==', email)
    //   .where('Password', '==', password)
      .get()
      .then((docs) => {
        if (docs.empty) {
          res.send('You Entered Incorrect Details');
          return;
        }
        const user = docs.docs[0].data();
        console.log(user)
        res.send(user)
      })
      .catch((error) => {
        console.error('Error:', error);
        res.status(500).send('An error occurred.');
      });
 
});

app.post('/hello',(req,res)=>{
    console.log(req.b)
})


const PORT = process.env.PORT || 300;

app.listen(PORT, () => {
    console.log("sd");
});