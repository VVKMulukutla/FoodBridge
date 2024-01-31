const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json'); // Replace '/path/to/key.json' with the actual path to your key.json file

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());

app.post('/upload', (req, res) => {
    const { name, quantity, timeOfCook, approxServing } = req.body;

    // Create a new document in the 'surplus' collection
    const docRef = admin.firestore().collection('surplusItems').doc();
    docRef.set({
        name,
        quantity,
        timeOfCook,
        approxServing
    })
    .then(() => {
        res.status(200).send('JSON uploaded to Firebase successfully');
    })
    .catch((error) => {
        console.error('Error uploading JSON to Firebase:', error);
        res.status(500).send('Error uploading JSON to Firebase');
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
// Send sample JSON to the /upload endpoint

