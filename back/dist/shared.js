"use strict";
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = void 0;
const mongodb_1 = require("mongodb");
const process_1 = require("process");
if (!((_a = process.env) === null || _a === void 0 ? void 0 : _a.MONGO_USER) || !((_b = process.env) === null || _b === void 0 ? void 0 : _b.MONGO_HOST) || !((_c = process.env) === null || _c === void 0 ? void 0 : _c.MONGO_PASSWORD)) {
    console.log("Wrong environment variables.");
    (0, process_1.exit)(1);
}
const uri = `mongodb://${(_d = process.env) === null || _d === void 0 ? void 0 : _d.MONGO_USER}:${(_e = process.env) === null || _e === void 0 ? void 0 : _e.MONGO_PASSWORD}@${(_f = process.env) === null || _f === void 0 ? void 0 : _f.MONGO_HOST}:27017?directConnection=true`;
const client = new mongodb_1.MongoClient(uri);
const remoteApi = {};
const matrixApi = {};
const status = {
    remoteApi,
    matrixApi,
    startTime: new Date(),
};
const shared = {
    api: null,
    cache: null,
    status: status,
    loggedStudent: {},
    mongo: client,
};
exports.COLLECTIONS = {
    students: null,
    coalitions: null,
    sessions: null,
    logs: null,
    projects: null,
    seats: null,
    requests: null,
};
exports.default = shared;
//# sourceMappingURL=shared.js.map