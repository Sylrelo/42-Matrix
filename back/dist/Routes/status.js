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
exports.statusHandler = void 0;
const shared_1 = __importStar(require("../shared"));
const security_1 = __importDefault(require("./security"));
const Student_1 = require("../Updater/Student");
const statusHandler = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const student = yield security_1.default.checkAuth(request, reply);
        if (student.is_pool) {
            reply.code(402);
            reply.send({});
            return;
        }
        const projectsCount = yield shared_1.COLLECTIONS.projects.count({});
        const recentlySeen = yield shared_1.COLLECTIONS.students.count({ last_seen: { $gt: Student_1.Student.lastseenTimeout } });
        const activeUpdatePendingCount = yield shared_1.COLLECTIONS.students.count({
            $and: [
                { last_seen: { $gt: Student_1.Student.lastseenTimeout } },
                { matrix_updated_at: { $lt: Student_1.Student.updateTimeout } },
            ],
        });
        const inactiveUpdatePendingCount = yield shared_1.COLLECTIONS.students.count({
            $or: [{ matrix_updated_at: 0 }, { matrix_updated_at: null }, { matrix_updated_at: { $exists: false } }],
        });
        const stalkingStudent = yield shared_1.COLLECTIONS.sessions.count({
            last_access: { $gte: new Date().getTime() - 30 * 1000 },
        });
        const totalStudent = yield shared_1.COLLECTIONS.students.count({});
        const dbStats = yield shared_1.default.mongo.db("42matrix").stats();
        reply.code(200);
        reply.send(Object.assign(Object.assign({}, shared_1.default.status), { pendingRequest: shared_1.default.api.getTotalPendingRequest(), recentlySeen,
            activeUpdatePendingCount,
            inactiveUpdatePendingCount,
            totalStudent,
            stalkingStudent, dataSize: dbStats.dataSize, storageSize: dbStats.storageSize, projectsCount: projectsCount - 1 }));
    }
    catch (error) {
        console.error(error);
        reply.code(400);
        reply.send({ error: "Authotization failure." });
    }
});
exports.statusHandler = statusHandler;
//# sourceMappingURL=status.js.map