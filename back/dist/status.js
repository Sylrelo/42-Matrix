"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logConnected = exports.addMatrixApiRequestStat = exports.newResponseTime = void 0;
const shared_1 = __importDefault(require("./shared"));
let lastHour = -1;
const newResponseTime = (value) => {
    const currentHour = new Date().getHours();
    if (!shared_1.default.status.remoteApi[currentHour] || currentHour !== lastHour) {
        shared_1.default.status.remoteApi[currentHour] = { responseTime: 0, count: 0 };
    }
    shared_1.default.status.remoteApi[currentHour].responseTime += value;
    shared_1.default.status.remoteApi[currentHour].count++;
    lastHour = currentHour;
};
exports.newResponseTime = newResponseTime;
const addMatrixApiRequestStat = (value) => {
    const currentHour = new Date().getHours();
    if (!shared_1.default.status.matrixApi[currentHour] || currentHour !== lastHour) {
        shared_1.default.status.matrixApi[currentHour] = { responseTime: 0, count: 0 };
    }
    shared_1.default.status.matrixApi[currentHour].responseTime += value;
    shared_1.default.status.matrixApi[currentHour].count++;
    lastHour = currentHour;
};
exports.addMatrixApiRequestStat = addMatrixApiRequestStat;
const logConnected = (promo, value) => {
    var _a, _b;
    const currentHour = new Date().getHours();
    if (!((_a = shared_1.default.loggedStudent) === null || _a === void 0 ? void 0 : _a[currentHour])) {
        shared_1.default.loggedStudent[currentHour] = {};
    }
    if (!((_b = shared_1.default.loggedStudent[currentHour]) === null || _b === void 0 ? void 0 : _b[promo]) || currentHour !== lastHour) {
        shared_1.default.loggedStudent[currentHour][promo] = {
            min: 0,
            max: 0,
            countForAvg: 0,
            totalForAvg: 0,
        };
    }
    shared_1.default.loggedStudent[currentHour][promo].max = Math.max(shared_1.default.loggedStudent[currentHour][promo].max, value);
    shared_1.default.loggedStudent[currentHour][promo].min = Math.max(shared_1.default.loggedStudent[currentHour][promo].min, value);
    shared_1.default.loggedStudent[currentHour][promo].totalForAvg += value;
    shared_1.default.loggedStudent[currentHour][promo].countForAvg++;
    lastHour = currentHour;
};
exports.logConnected = logConnected;
//# sourceMappingURL=status.js.map