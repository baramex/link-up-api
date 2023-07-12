import express from 'express';
import { SessionMiddleware } from '../models/session.model';
import { UserMiddleware } from '../models/user.model';
import { PERMISSIONS } from '../utils/role';
const router = express.Router();

router.get("/user/:id", SessionMiddleware.requiresValidAuthExpress, UserMiddleware.parseParamsUser(), async (req, res) => {
    try {
        res.status(200).json(req.paramsUser);
    } catch (error) {
        console.error(error);
        res.status(400).json(error.message || { message: "An error occured.", error: "UnknownError" });
    }
});

module.exports = router;