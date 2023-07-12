import { Schema, Types, model } from 'mongoose';
import { PERMISSIONS, ROLE_VALUES } from '../utils/role.js';
import { CustomError } from '../utils/error.js';

const accountType = {
    PUBLIC: 0,
    ANONYMOUS: 1
};

const followingStateType = {
    PENDING: 0,
    APPROVED: 1
};

const usernameRegex = /^[a-Z0-9]{3,64}$/;
const bioRegex = /^[a-ZÀ-ÖØ-öø-ÿ0-9.-_,;|\/&%\(\)\p{Emoji} ]$/u;

const userSchema = new Schema({
    email: { type: String, validator: { validate: isEmail, message: 'Invalid email address.' }, trim: true, lowercase: true, required: true, unique: true },
    username: { type: String, validator: { validate: usernameRegex, message: 'Invalid username.' }, trim: true, required: true, unique: true },
    bio: { type: String, validator: { validate: bioRegex, message: 'Invalid bio.' }, trim: true },
    role: { type: Number, min: 0, max: Object.keys(ROLE_VALUES).length - 1, get: v => ROLE_VALUES[v], required: true },
    birthdate: { type: Date, required: true },
    type: { type: Number, enum: Object.values(accountType), required: true },
    avatar: { type: String },
    tags: { type: [{ tagId: { type: Types.ObjectId, ref: 'Tag', required: true } }], default: [], required: true },
    following: { type: [{ userId: { type: Types.ObjectId, ref: 'User', required: true }, state: { enum: Object.values(followingStateType), required: true } }] },
    date: { type: Date, default: Date.now, required: true }
});

export const UserModel = model("User", userSchema, "users");

export class User {
    static hasPermission(user, ...permissions) {
        if (!permissions || permissions.length == 0) return true;
        if (!user) return false;
        return permissions.every(p => user.role.permissions?.includes(p)) || user.role.permissions?.includes(PERMISSIONS.ALL);
    }

    static getFields(user, admin) {
        const returnType = admin ? accountType.PUBLIC : user.type;
        return returnType === accountType.PUBLIC ? { username: user.username, bio: user.bio, role: user.role, avatar: user.avatar, tags: user.tags, following: user.following } : { username: user.username, avatar: user.avatar, role: user.role };
    }
}

export class UserMiddleware {
    static parseParamsUser() {
        return async (req, res, next) => {
            try {
                const id = req.params.id;
                if (!id || (id == "@me" ? false : typeof id !== "string")) throw new CustomError({ message: "Invalid request.", error: "InvalidRequest" });

                if (id == "@me" || req.user.userId === id) req.paramsUser = req.user;
                else {
                    const user = await UserModel.findById(id);
                    if (!user) throw new CustomError({ message: "User not found.", error: "UserNotFound" });
                    req.paramsUser = User.getFields(user, User.hasPermission(user, PERMISSIONS.VIEW_USERS));
                }

                next();
            } catch (error) {
                console.error(error);
                res.status(error.status || 400).json(error.message || { message: "An error occured.", error: "UnknownError" });
            }
        }
    }

    static requiresPermissions(...permissions) {
        return (req, res, next) => {
            try {
                if (!req.user || !User.hasPermission(req.user, ...permissions)) throw new CustomError({ message: "Non autorisé.", error: "Unauthorized" }, 403);
                next();
            } catch (error) {
                console.error(error);
                res.status(error.status || 400).json(error.message || { message: "An error occured.", error: "UnknownError" });
            }
        }
    }
}