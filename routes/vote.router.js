const express = require("express")
const session = require('express-session');
const bodyParser = require("body-parser")
const bcrypt = require('bcrypt');
const saltRounds = 10;

const router = express.Router()

// url parser
const urlEncodedParser = bodyParser.urlencoded({ extended: false })
router.use(urlEncodedParser);

// data base connection
const { db } = require("../db/connection.db")

router.get('/', (req, res) => {
    const user = req.session.user;
    if (user) {
        res.status(200).send({message: "sessioned user is found!", user});
    } else {
        res.status(404).send({message: "sessioned user is not found!", user});
    }
});


module.exports = router;