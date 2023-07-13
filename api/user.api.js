import express from 'express';
import { SessionMiddleware } from '../models/session.model';
import { User, UserMiddleware, UserModel } from '../models/user.model';
const router = express.Router();

router.post('/', SessionMiddleware.isValidAuthExpress, async (req, res) => {
    try {
        if (!req.body) throw new Error({ message: "Invalid request.", error: "InvalidRequest" }, 400);

        const { password, email, birthdate, tags, bio, username } = req.body;
        if (typeof password != "string" || typeof email != "string" || typeof birthdate !== 'string' || !Array.isArray(tags) || typeof bio !== 'string' || typeof username !== 'string') throw new Error({ message: "Invalid request.", error: "InvalidRequest" });

        // TODO: validate tags

        const user = await new UserModel({ password, email, birthdate, tags, bio, username }).save();
        res.status(201).json(User.getUserFields(user));
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "Une erreur est survenue.", error: "UnknownError" });
    }
});

router.get("/:id", SessionMiddleware.requiresValidAuthExpress, UserMiddleware.parseParamsUser, async (req, res) => {
    try {
        res.status(200).json(req.paramsUser);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json(error.message || { message: "Interval server error.", error: "IntervalServerError" });
    }
});

module.exports = router;