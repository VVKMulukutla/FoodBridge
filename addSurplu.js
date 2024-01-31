const express = require('express');
const app = express();
const path = require('path');

const bcrypt = require('bcrypt')
var admin = require("firebase-admin");
const saltRounds = 10;
var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/',function(req,res){
  res.sendFile(__dirname+'/demopage.html')
})


app.get("/usersignin.html",function(req,res){
  res.sendFile(__dirname+'/usersignin.html');
})



app.get("/signupsubmit", function (req, res) {
  const { uname, email, password } = req.query;

  // Check if the email already exists
  db.collection("admindetails")
    .where("email", "==", email)
    .get()
    .then((docs) => {
      if (docs.size > 0) {
        return res.send("Email already exists");
      }

      // Hash the password and store it in the database
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          console.error(err);
          return res.send("Failed to sign up");
        }

        db.collection("admindetails")
          .add({
            name: uname,
            email: email,
            password: hash, // Store the hashed password
          })
          .then(() => {
            res.redirect('/userLogin.html');
          })
          .catch((err) => {
            console.error(err);
            res.send("Failed to sign up");
          });
      });
    })
    .catch((err) => {
      console.error(err);
      res.send("Failed to sign up");
    });
});





app.get("/userLogin.html",function(req,res){
  res.sendFile(__dirname+'/userLogin.html')
})




app.get("/loginsubmit",function(req,res){
  const { username, password } = req.query;

  db.collection('admindetails')
    .where("name" ,"==" ,username)
    .get()
    .then((docs)=>{
        if(docs.size > 0){
            const user = docs.docs[0].data(); // Assuming username is unique

            // Compare the hashed password with the input password
            bcrypt.compare(password, user.password, (err, result) => {
              if (err) {
                console.error(err);
                return res.send("Failed");
              }
              if (result) {
                res.redirect('/AdminDashboard');
              } else {
                res.send("Failed");
              }
            });
        }
        else{
            res.send("Failed");
        }
    })
    .catch((err) => {
        console.error(err);
        res.send("Failed");
    });
})



app.get("/AdminDashboard", (req, res) => {
  res.sendFile(__dirname+'/AdminDashboard.html');
});


app.listen(5000, function(){
   console.log('listening on *:5000');
});