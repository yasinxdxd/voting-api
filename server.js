const express = require('express')
const session = require('express-session')
const cors = require('cors');
require('dotenv').config()

const { db } = require('./db/connection.db');

const app = express()
app.set('trust proxy', true);

const API_KEY = process.env.VOTE_APP_API_KEY;

// middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json())
// Configure the session middleware
app.use(session({
  secret: process.env.SESSION_SECRET, // replace with a strong, secure secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set secure to true if your application is served over HTTPS
}));

const validateApiKey = (req, res, next) => {
  const apiKey = req.header('x-api-key'); // Use a custom header for the API key.
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing API key.' });
  }
  
  next(); // API key is valid, proceed to the next middleware or route handler.
};

app.use(validateApiKey);

app.get('/', async function (req, res) {
  const usage = {
    message: "Welcome to the voting-api",
    endpoints: {
      index: [{endpoint: "/", method: "GET"}],
      auth: [
        {endpoint: "/auth/signin", method: "POST"},
        {endpoint: "/auth/signup", method: "POST"}
      ]
    }
  }
  res.send(usage);
})

const authRouter = require("./routes/auth.router")
app.use("/auth", authRouter)

const profileRouter = require("./routes/profile.router")
app.use("/profile", profileRouter)

const adminRouter = require("./routes/admin.router")
app.use("/admin", adminRouter)

const voteRouter = require("./routes/vote.router")
app.use("/vote", voteRouter)

app.listen(5000)