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

//TODO: test all of the aabove routes!

// Middleware to ensure user is logged in
const ensureLoggedIn = (req, res, next) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).send({ message: "User not logged in!" });
    }
    next();
};

// Get available elections
router.get('/elections', ensureLoggedIn, async (req, res) => {
    try {
        const elections = await db.query("SELECT * FROM election WHERE beginning_date <= NOW() AND ending_date >= NOW()");
        res.status(200).send({ message: "Available elections", elections: elections });
    } catch (error) {
        res.status(500).send({ message: "Error fetching elections", error });
    }
});

// Register user for an election
router.post('/register', ensureLoggedIn, async (req, res) => {
    const userId = req.session.user.id;
    const { electionId } = req.body;

    try {
        // Check if already registered
        const existingRegistration = await db.query(
            "SELECT * FROM voter_registrations WHERE user_id = $1 AND election_id = $2",
            [userId, electionId]
        );

        if (existingRegistration.rows.length > 0) {
            return res.status(400).send({ message: "User already registered for this election" });
        }

        // Register the user
        await db.query(
            "INSERT INTO voter_registrations (user_id, election_id) VALUES ($1, $2)",
            [userId, electionId]
        );

        // Generate a ballot token
        const token = require('crypto').randomUUID();
        await db.query(
            "INSERT INTO ballot_tokens (token, election_id) VALUES ($1, $2)",
            [token, electionId]
        );

        res.status(200).send({ message: "User registered successfully", token });
    } catch (error) {
        res.status(500).send({ message: "Error registering user", error });
    }
});

// Cast a vote
router.post('/vote', ensureLoggedIn, async (req, res) => {
    const { token, candidateId } = req.body;

    try {
        // Validate the ballot token
        const ballotToken = await db.query(
            "SELECT * FROM ballot_tokens WHERE token = $1 AND is_used = FALSE",
            [token]
        );

        if (ballotToken.rows.length === 0) {
            return res.status(400).send({ message: "Invalid or already used token" });
        }

        const electionId = ballotToken.rows[0].election_id;

        // Record the vote
        await db.query(
            "INSERT INTO votes (candidate_id, election_id) VALUES ($1, $2)",
            [candidateId, electionId]
        );

        // Mark the token as used
        await db.query(
            "UPDATE ballot_tokens SET is_used = TRUE WHERE token = $1",
            [token]
        );

        res.status(200).send({ message: "Vote cast successfully" });
    } catch (error) {
        res.status(500).send({ message: "Error casting vote", error });
    }
});

// Fetch election results
router.get('/results/:electionId', async (req, res) => {
    const { electionId } = req.params;

    try {
        const results = await db.query(
            `SELECT 
                c.id AS candidate_id, 
                c.name AS candidate_name, 
                COUNT(v.id) AS votes
            FROM 
                candidates c 
            LEFT JOIN 
                votes v 
            ON 
                c.id = v.candidate_id
            WHERE 
                c.election_id = $1
            GROUP BY 
                c.id
            ORDER BY 
                votes DESC`,
            [electionId]
        );

        res.status(200).send({ message: "Election results", results: results.rows });
    } catch (error) {
        res.status(500).send({ message: "Error fetching results", error });
    }
});


module.exports = router;