const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const shortid = require('shortid');
require('dotenv').config({ path: 'sample.env' })

const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost/exercise-track", { useNewUrlParser: true }, { useUnifiedTopology: true })

const users = [];
const exercises = [];

const getUsernameById = id => users.find(user => user._id === id).username;
const getExercisesFromUserWithId = id => exercises.filter(exe => exe._id === id);

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  const { username } = req.body;

  const newUser = {
    username,
    _id: shortid.generate()
  };
  users.push(newUser);
  return res.json(newUser);

});


app.post('/api/exercise/add', (req, res) => {
  let { userId, description, duration, date } = req.body;

  let dateObj = date === '' ? new Date() : new Date(date);

  const newExercise = {
    _id: userId,
    description,
    duration: +duration,
    date: dateObj.toString().slice(0, 15),
    username: getUsernameById(userId)
  };
  exercises.push(newExercise);
  res.json(newExercise);

});

app.get('/api/exercise/log', (req, res) => {
  let { userId, from, to, limit } = req.query;

  //const { userId, from, to, limit } = req.query;
  let log = getExercisesFromUserWithId(userId);

  if (from) {
    const fromDate = new Date(from);
    log = log.filter(exe => new Date(exe.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter(exe => new Date(exe.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, +limit);
  }

  res.json({
    userId,
    username: getUsernameById(userId),
    count: log.length,
    log
  });
});

app.get('/api/exercise/users', (req, res) => {
  return res.json(users);


})

app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})