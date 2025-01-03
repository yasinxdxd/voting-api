const express = require("express");
const bcrypt = require("bcrypt");
const session = require('express-session');
const bodyParser = require("body-parser");

const router = express.Router();

// URL parser
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// Database connection
const { db } = require("../db/connection.db");

router.get('/validate', async (req, res) => {
    const admin = req.session.admin;
    if (admin) {
        res.status(200).send({message: "sessioned admin is found!", admin});
    } else {
        res.status(404).send({message: "sessioned admin is not found!", admin});
    }
});

// Admin Sign-In Route
router.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    try {
        // FIXME: make it on production
        // Obtain client IP address
        // const clientIP = req.ip;
        // console.log(clientIP)

        // // List of allowed IPs
        // const allowedIPs = ["192.168.1.22"]; // Replace with actual allowed IPs

        // // Check if the IP address is allowed
        // if (!allowedIPs.includes(clientIP)) {
        //     return res.status(403).send({ message: "Sign-in is restricted to specific IP addresses" });
        // }

        // Check if admin exists
        const result = await db.oneOrNone("SELECT * FROM admins WHERE username = $1", [username]);

        if (result == null) {
            return res.status(404).send({ message: "Admin not found" });
        }

        const admin = result;

        // Compare passwords
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).send({ message: "Invalid credentials" });
        }

        // Set admin session
        req.session.admin = { id: admin.id, username: admin.username };

        res.status(200).send({ message: "Admin signed in successfully", admin: { id: admin.id, username: admin.username } });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error during admin sign-in", error });
    }
});

router.post('/signup', async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    try {
        // Validate fields
        if (!username || !password || !confirmPassword) {
            return res.status(400).send({ message: "Username, password, and confirmPassword are required." });
        }

        if (password !== confirmPassword) {
            return res.status(400).send({ message: "Passwords do not match." });
        }

        // Check if admin already exists
        const result = await db.oneOrNone(`SELECT * FROM admins WHERE username = $1`, [username]);
        if (result != null) {
            return res.status(409).send({ message: "Admin with this username already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new admin into the database
        const newAdmin = await db.one(
            `INSERT INTO admins (username, password) VALUES ($1, $2) RETURNING *`,
            [username, hashedPassword]
        );

        res.status(201).send({ message: "Admin signed up successfully", admin: newAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error during admin sign-up", error });
    }
});

const createRouter = express.Router();

//TODO: test all of the aabove routes!

// Middleware to ensure admin is signed in
createRouter.use((req, res, next) => {
    console.log("admin:" + req.session.admin);
    if (!req.session.admin) {
        return res.status(401).send({ message: "Unauthorized. Admin must be signed in to perform this action." });
    }
    next();
});

// Create Election
createRouter.post('/election', async (req, res) => {
    const { title, description, beginning_date, ending_date } = req.body;

    try {
        if (!title || !beginning_date || !ending_date) {
            return res.status(400).send({ message: "Missing required fields: title, beginning_date, or ending_date." });
        }

        const result = await db.one(
            "INSERT INTO election (title, description, beginning_date, ending_date) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, description, beginning_date, ending_date]
        );

        res.status(201).send({ message: "Election created successfully", election: result });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error creating election", error });
    }
});

// Create Party
createRouter.post('/party', async (req, res) => {
    const { name, description } = req.body;
    try {
        if (!name) {
            return res.status(400).send({ message: "Party name is required." });
        }

        const result = await db.one(
            "INSERT INTO parties (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );

        res.status(201).send({ message: "Party created successfully", party: result });
    } catch (error) {
        if (error.code === '23505') {
            // Handle unique constraint violation (duplicate party name)
            return res.status(409).send({ message: "Party name already exists." });
        }
        console.error(error);
        res.status(500).send({ message: "Error creating party", error });
    }
});

// Create Candidate
createRouter.post('/candidate', async (req, res) => {
    const { name, party_id, election_id, description } = req.body;

    try {
        if (!name || !party_id || !election_id) {
            return res.status(400).send({ message: "Missing required fields: name, party_id, or election_id." });
        }

        // Ensure party and election exist
        const partyCheck = await db.oneOrNone("SELECT * FROM parties WHERE id = $1", [party_id]);
        const electionCheck = await db.oneOrNone("SELECT * FROM election WHERE id = $1", [election_id]);

        if (partyCheck == null) {
            return res.status(404).send({ message: "Party not found." });
        }

        if (electionCheck == null) {
            return res.status(404).send({ message: "Election not found." });
        }

        const result = await db.query(
            "INSERT INTO candidates (name, party_id, election_id, description) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, party_id, election_id, description]
        );

        res.status(201).send({ message: "Candidate created successfully", candidate: result });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error creating candidate", error });
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    if (req.session.admin) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send({ message: "Error during logout", error: err });
            }
            res.status(200).send({ message: "Admin logged out successfully" });
        });
    } else {
        res.status(400).send({ message: "No admin is currently logged in" });
    }
});

// Mount `/create` router
router.use('/create', createRouter);

module.exports = router;
