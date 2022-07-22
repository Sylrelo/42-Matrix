"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const shared_1 = require("../shared");
const isUidValid = (request, uid, authorizedStudent = []) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield shared_1.COLLECTIONS.sessions.findOne({ uid });
        if (!session)
            return null;
        if (authorizedStudent.length && !authorizedStudent.includes(session.student_id)) {
            return null;
        }
        const ipHash = (0, crypto_1.createHash)("sha256").update(request.ip).digest("hex");
        if ((new Date().getTime() - session.last_access) / 1000 > 10080 * 60 ||
            (session.ip_hash && session.ip_hash !== ipHash)) {
            try {
                yield shared_1.COLLECTIONS.sessions.deleteOne({ uid });
            }
            catch (error) {
                console.error(error);
            }
            return null;
        }
        yield shared_1.COLLECTIONS.sessions.updateOne({ uid }, { $set: { last_access: new Date().getTime(), ip_hash: ipHash } });
        const student = yield shared_1.COLLECTIONS.students.findOne({ id: session.student_id });
        const admins = [40737];
        return {
            is_pool: student === null || student === void 0 ? void 0 : student.matrix_is_pool,
            is_admin: admins.includes(+session.student_id),
            student_id: +session.student_id,
        };
    }
    catch (error) {
        console.error(error);
    }
    return null;
});
const checkAuth = (request, response, authorizedStudent = []) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const uid = (_a = request.headers) === null || _a === void 0 ? void 0 : _a.authorization;
        if (!uid) {
            throw new Error("Invalid authorization.");
            return null;
        }
        const isValid = yield isUidValid(request, uid, authorizedStudent);
        if (!isValid) {
            throw new Error("Expired authorization.");
            return null;
        }
        return isValid;
    }
    catch (error) {
        response.code(400);
        response.send({ error: "Session error." });
        throw error;
    }
});
exports.default = {
    isUidValid,
    checkAuth,
};
//# sourceMappingURL=security.js.map