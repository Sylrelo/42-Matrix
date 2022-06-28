"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = void 0;
const mongodb_1 = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
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