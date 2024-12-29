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


router.post('/signin', async (req, res) => {
    const { tc_no, password } = req.body;

    try {
        // Fetch the hashed password from the database
        const hashResult = await db.oneOrNone(
            `SELECT u.password FROM users u WHERE u.tc_no = $1;`,
            [tc_no]
        );

        if (!hashResult) {
            return res.status(401).json({ message: 'Invalid TC No!' });
        }

        const hash = hashResult.password;

        // Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Fetch the user's full data from the database
        const user = await db.one(
            `SELECT * FROM users u WHERE u.tc_no = $1;`,
            [tc_no]
        );

        // Set user session
        req.session.user = user;
        console.log(req.session.user);

        return res.status(200).send({
            message: "Authentication is successful!",
            data: { tc_no, hash }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: `Error during sign-in: ${error.message}`,
            data: req.body
        });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const bd = req.body;

        try {
            req.body.notification = req.body.notification === "true" ? true : false;
        } catch (error) {
            body.notification = false;
        }

        // check for tc_no to be unique
        const user = await db.oneOrNone(`
            SELECT *
            FROM users u
            WHERE
            u.tc_no = $1;
        `, [bd.tc_no]);
        
        console.log(user)
        if (user !== null) {
            return res.status(400).send({message: "TC No is already taken!", data: req.body});
        }

        bcrypt.hash(bd.password, saltRounds, async function(err, hash) {
            await db.any(`
                INSERT INTO users(tc_no, first_name, last_name, password, birthdate, gender)
                VALUES ($1, $2, $3, $4, $5, $6);
            `, [bd.tc_no, bd.first_name, bd.last_name, hash, bd.birthdate, bd.gender]);

            // req.session.user = {...body};
            return res.status(201).send({message: "success, user is created!"});
        });
    } catch (error) {
        return res.status(500).send({message: `error at response body: ${error}`, data: req.body})
    }
})

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Could not log out' });
        } else {
            res.status(200).send({ message: 'Logged out successfully' });
        }
    });
});

module.exports = router;