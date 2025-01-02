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

router.get('/user', async (req, res) => {
    const user = req.session.user;
    if (user) {
        const record = await db.oneOrNone(`
            SELECT *
            FROM users u
            WHERE u.tc_no = $1
            `,
            [user.tc_no]
        );
        res.status(200).send({message: "sessioned user is found!", record});
    } else {
        res.status(404).send({message: "sessioned user is not found!", user});
    }
});


const setRouter = express.Router();

setRouter.post('/password', async (req, res) => {
    const { previous_password, new_password, new_password_again } = req.body;

    // Check if the new passwords match
    if (new_password !== new_password_again) {
        return res.status(400).json({ message: "New passwords do not match!" });
    }

    const user = req.session.user;

    // Validate the sessioned user
    if (!user || !user.tc_no) {
        return res.status(404).json({ message: "Sessioned user is not found!" });
    }

    const tc_no = user.tc_no;

    try {
        // Retrieve the current hashed password from the database
        const record = await db.oneOrNone(`
            SELECT u.password
            FROM users u
            WHERE u.tc_no = $1
            `,
            [tc_no]
        );

        if (!record || !record.password) {
            return res.status(401).json({ message: "Invalid TC No!" });
        }

        const currentHash = record.password;

        // Compare the previous password with the hash in the database
        const isMatch = await bcrypt.compare(previous_password, currentHash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid previous password!" });
        }

        // Hash the new password
        const newHash = await bcrypt.hash(new_password, saltRounds);

        // Update the password in the database
        await db.none(`
            UPDATE users
            SET password = $1
            WHERE tc_no = $2
            `,
            [newHash, tc_no]
        );

        return res.status(200).json({ message: "User password is changed successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong..." });
    }
});

setRouter.post('/first_name', async (req, res) => {
    const { new_first_name } = req.body;
    const user = req.session.user;

    // Validate the sessioned user
    if (!user || !user.tc_no) {
        return res.status(404).json({ message: "Sessioned user is not found!" });
    }

    const tc_no = user.tc_no;

    try {
        // Update the first_name in the database
        await db.none(
            `
            UPDATE users
            SET first_name = $1
            WHERE tc_no = $2
            `,
            [new_first_name, tc_no]
        );

        // Optionally update the sessioned user object
        user.first_name = new_first_name;

        return res.status(200).json({ message: "User's first name is updated successfully!", user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong during the update." });
    }
});

setRouter.post('/last_name', async (req, res) => {
    const { new_last_name } = req.body;
    const user = req.session.user;

    // Validate the sessioned user
    if (!user || !user.tc_no) {
        return res.status(404).json({ message: "Sessioned user is not found!" });
    }

    const tc_no = user.tc_no;

    try {
        // Update the last_name in the database
        await db.none(
            `
            UPDATE users
            SET last_name = $1
            WHERE tc_no = $2
            `,
            [new_last_name, tc_no]
        );

        // Optionally update the sessioned user object
        user.last_name = new_last_name;

        return res.status(200).json({ message: "User's last name is updated successfully!", user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong during the update." });
    }
});


setRouter.post('/all', async (req, res) => {
    const { 
        previous_password, 
        new_password, 
        new_password_again, 
        new_first_name, 
        new_last_name 
    } = req.body;

    const user = req.session.user;

    // Validate the sessioned user
    if (!user || !user.tc_no) {
        return res.status(404).json({ message: "Sessioned user is not found!" });
    }

    const tc_no = user.tc_no;

    try {
        // Initialize an object to track updates
        const updates = {};

        // Handle password update
        if (previous_password && new_password && new_password_again) {
            if (new_password !== new_password_again) {
                return res.status(400).json({ message: "New passwords do not match!" });
            }

            // Retrieve the current hashed password from the database
            const record = await db.oneOrNone(
                `SELECT u.password FROM users u WHERE u.tc_no = $1`,
                [tc_no]
            );

            if (!record || !record.password) {
                return res.status(401).json({ message: "Invalid TC No!" });
            }

            const currentHash = record.password;

            // Compare the previous password with the hash in the database
            const isMatch = await bcrypt.compare(previous_password, currentHash);

            if (!isMatch) {
                return res.status(401).json({ message: "Invalid previous password!" });
            }

            // Hash the new password
            updates.password = await bcrypt.hash(new_password, saltRounds);
        }

        // Handle first name update
        if (new_first_name) {
            updates.first_name = new_first_name;
            user.first_name = new_first_name; // Optionally update the session
        }

        // Handle last name update
        if (new_last_name) {
            updates.last_name = new_last_name;
            user.last_name = new_last_name; // Optionally update the session
        }

        // Update the database with the collected updates
        const updateFields = Object.keys(updates);
        if (updateFields.length > 0) {
            const updateStatements = updateFields.map(
                (field, index) => `${field} = $${index + 1}`
            ).join(", ");

            const updateValues = Object.values(updates);

            await db.none(
                `UPDATE users SET ${updateStatements} WHERE tc_no = $${updateFields.length + 1}`,
                [...updateValues, tc_no]
            );
        }

        return res.status(200).json({ 
            message: "User profile updated successfully!", 
            user 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong during the update." });
    }
});


// Mount `/set` router
router.use('/set', setRouter);

module.exports = router;