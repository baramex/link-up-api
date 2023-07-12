const { Schema, Types } = require("mongoose");
const { genSync } = require("random-web-token");

const session = new Schema({
    refreshToken: String,
    token: String,
    user: { type: Types.ObjectId, ref: "User", required: true },
    ips: { type: [String], required: true },
    active: { type: Boolean, default: true, required: true },
    date: { type: Date, default: Date.now, required: true },
});

session.post("validate", async function (doc, next) {
    if (doc.isModified("active") || doc.isNew) {
        if (doc.active) {
            doc.token = genSync("extra", 30);
            doc.refreshToken = genSync("extra", 40);
            doc.date = new Date();

            doc.markModified("token");
            doc.markModified("refreshToken");
            doc.markModified("date");
        }
        else {
            doc.token = undefined;

            doc.markModified("token");
        }
    }
    next();
});

export const SessionModel = model('Session', session, "sessions");

export class Session {
    static expiresIn = 60 * 60 * 24 * 2;
    static expiresInRefresh = 60 * 60 * 24 * 7;
    static populate = {
        path: "user"
    };

    static disable(session) {
        session.active = false;
        return session.save({ validateBeforeSave: true });
    }

    static getSession(query) {
        return SessionModel.findOne(query).populate(Session.populate);
    }

    static getSessionByRefreshToken(refreshToken) {
        return Session.getSession({ refreshToken, date: { $gt: Date.now() - Session.expiresInRefresh * 1000 } }).populate(Session.populate);
    }

    static checkExpired(session) {
        return new Date().getTime() - session.date.getTime() > Session.expiresIn * 1000;
    }

    static update() {
        SessionModel.updateMany({ active: true, date: { $lt: new Date().getTime() - Session.expiresIn * 1000 } }, { $set: { active: false }, $unset: { token: true } }, { runValidators: true }).catch(console.error);
    }
}

export class SessionMiddleware {
    static async checkValidAuth(cookies) {
        if (!cookies) throw new Error();

        const token = cookies.token;
        if (!token) throw new Error();

        const session = await Session.getSession({ token, active: true });
        if (!session || !session.user) throw new Error();
        if (Session.checkExpired(session.date)) throw new Error();

        return { user: session.user, session };
    }

    static async requiresValidAuthExpress(req, res, next) {
        try {
            const result = await SessionMiddleware.checkValidAuth(req.cookies);
            req.user = result.user;
            req.session = result.session;

            next();
        } catch (error) {
            console.error(error);
            res.clearCookie("token").status(401).json(error.message || { message: "Unauthorized.", error: "Unauthorized" });
        }
    }

    static async isValidAuthExpress(req, res, next) {
        try {
            await SessionMiddleware.checkValidAuth(req.cookies);
            req.isAuthed = true;
        } catch (error) {
            req.isAuthed = false;
        }
        next();
    }
}

Session.update();
setInterval(Session.update, 1000 * 60 * 30);