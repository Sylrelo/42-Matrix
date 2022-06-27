"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authVerifyHandler = exports.logoutHandler = exports.authHandler = void 0;
const crypto_1 = require("crypto");
const shared_1 = __importStar(require("../shared"));
const security_1 = __importDefault(require("./security"));
const authHandler = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    //@ts-ignore
    const accessCode = (_a = request.body) === null || _a === void 0 ? void 0 : _a.code;
    // A typer correctement
    try {
        const response = yield shared_1.default.api.authorisationPost(accessCode);
        const student = yield shared_1.default.api.getUser(response.access_token, "me");
        if (student === null || student === void 0 ? void 0 : student["alumni?"]) {
            reply.code(401);
            reply.send({ error: "Your access to the 42 intranet is revoked." });
            return;
        }
        if (!((_b = student === null || student === void 0 ? void 0 : student.campus_users) === null || _b === void 0 ? void 0 : _b.find((campus) => campus.campus_id === 9))) {
            reply.code(401);
            reply.send({ error: "Your do not belong to the 42 Lyon campus." });
            return;
        }
        const isPool = !((_c = student.cursus_users) === null || _c === void 0 ? void 0 : _c.filter((cursus) => { var _a, _b, _c; return !((_c = (_b = (_a = cursus.cursus) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === null || _c === void 0 ? void 0 : _c.includes("piscine")); })).length;
        const uid = (0, crypto_1.randomUUID)();
        const currentTime = new Date().getTime();
        const ipHash = (0, crypto_1.createHash)("sha256").update(request.ip).digest("hex");
        yield shared_1.COLLECTIONS.sessions.insertOne({
            uid,
            student_id: student.id,
            created_at: currentTime,
            last_access: currentTime,
            ip_hash: ipHash,
            is_temporary: isPool,
        });
        reply.code(200);
        reply.send({ access: response, student, uid });
    }
    catch (error) {
        reply.code(400);
        reply.send({ error: "Authotization failure." });
    }
});
exports.authHandler = authHandler;
const logoutHandler = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const uid = (_d = request.headers) === null || _d === void 0 ? void 0 : _d.authorization;
        yield shared_1.COLLECTIONS.sessions.deleteOne({ uid });
    }
    finally {
        reply.code(200);
        reply.send({});
    }
});
exports.logoutHandler = logoutHandler;
const authVerifyHandler = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const student = yield security_1.default.checkAuth(request, reply);
        reply.code(200);
        reply.send(student);
    }
    catch (error) {
        console.error(error);
        reply.code(400);
        reply.send({ error: "Authotization failure." });
    }
});
exports.authVerifyHandler = authVerifyHandler;
//# sourceMappingURL=authenticate.js.map