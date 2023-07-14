import express from 'express';
import { SessionMiddleware } from '../models/session.model';
import { User, UserMiddleware, UserModel } from '../models/user.model';
import fileUpload from 'express-fileupload';
import { PERMISSIONS } from '../utils/role';
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
        res.status(400).json(error.message || { message: "An error occured.", error: "UnknownError" });
    }
});

router.get("/:id", SessionMiddleware.requiresValidAuthExpress, UserMiddleware.parseParamsUser(), async (req, res) => {
    try {
        res.status(200).json(req.paramsUser);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json(error.message || { message: "Interval server error.", error: "IntervalServerError" });
    }
});

router.post('/:id/avatar', SessionMiddleware.requiresValidAuthExpress, UserMiddleware.parseParamsUser(PERMISSIONS.MANAGE_USERS), fileUpload(), async (req, res) => {
    try {
        console.log(req.files)
        if (!req.files || !req.files.avatar) throw new Error({ message: "Invalid request.", error: "InvalidRequest" }, 400);

        const avatar = req.files.avatar;
        if (avatar.mimetype !== 'image/png' && avatar.mimetype !== 'image/jpeg' && avatar.mimetype !== 'image/jpg') throw new Error({ message: "Invalid request.", error: "InvalidRequest" }, 400);

        // check size

        const avatarPath = `./uploads/avatars/${req.paramsUser._id}.${avatar.mimetype.split('/')[1]}`;
        await avatar.mv(avatarPath);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json(error.message || { message: "Interval server error.", error: "IntervalServerError" });
    }
});

router.patch('/:id', SessionMiddleware.requiresValidAuthExpress, UserMiddleware.parseParamsUser(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        if (!req.body) throw new Error({ message: "Invalid request.", error: "InvalidRequest" }, 400);

        const { password, email, birthdate, tags, bio, username } = req.body;

        if(password && typeof password === 'string') req.paramsUser.password = password;
        if(email && typeof email === 'string') req.paramsUser.email = email;
        if(birthdate && typeof birthdate === 'string') req.paramsUser.birthdate = birthdate;
        if(tags && Array.isArray(tags)) req.paramsUser.tags = tags; // TODO: validate tags
        if(bio && typeof bio === 'string') req.paramsUser.bio = bio;
        if(username && typeof username === 'string') req.paramsUser.username = username;

        await req.paramsUser.save();
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json(error.message || { message: "Interval server error.", error: "IntervalServerError" });
    }
});

module.exports = router;