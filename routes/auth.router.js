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
    const tc_no = req.body.tc_no;
    const password = req.body.password;
    let hash = await db.oneOrNone(`
        SELECT u.password
        FROM users u
        WHERE
        u.tc_no = $1;
    `, [tc_no]);
    
    if (!hash) {
        return res.status(401).json({ message: 'Invalid TC No!' });
    }

    hash = hash.password;

    try {
        bcrypt.compare(password, hash, async function(err, result) {
            if (result == true) {
                let user = await db.one(`
                    SELECT *
                    FROM users u
                    WHERE
                    u.tc_no = $1 AND u.password = $2;
                `, [tc_no, hash]);

                req.session.user = user;
                console.log(req.session.user)
                res.status(200).send({message: "authentication is successful!", data: {tc_no, hash}});
            } else {
                console.error(err);
                return res.status(401).json({ message: 'Invalid password' });
            }
        });

    } catch (error) {
        return res.status(500).send({message: `error at response body: ${error}`, data: req.body})
    }
})

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