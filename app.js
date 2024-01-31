// const admin = require('firebase-admin');
// const fs = require('fs');
// const serviceAccount = require('./key.json');

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

// // Read the image file
// const filePath = './download.jpg';
// const imageBuffer = fs.readFileSync(filePath);
// const base64Image = imageBuffer.toString('base64');

// // Create a new document in Firestore collection
// const db = admin.firestore();
// const collectionRef = db.collection('image');
// const docRef = collectionRef.doc();

// // Set the Base64 encoded image as a field in the document
// docRef.set({
//     image: base64Image,
//     text: "hello myan"
// })
//     .then(() => {
//         console.log('Image uploaded successfully!');
//     })
//     .catch((error) => {
//         console.error('Error uploading image:', error);
//     });

