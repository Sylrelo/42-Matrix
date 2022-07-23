"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_ACCOUNT = exports.CONFIG = exports.START_TIME = exports.coalition = exports.location = exports.student = void 0;
const Coalitions_1 = require("./Updater/Coalitions");
const Location_1 = require("./Updater/Location");
const Student_1 = require("./Updater/Student");
exports.student = new Student_1.Student();
exports.location = new Location_1.Location();
exports.coalition = new Coalitions_1.Coalition();
exports.START_TIME = +new Date();
exports.CONFIG = { CLIENT_SECRET: "" };
exports.TEST_ACCOUNT = ["chmaubla", "kilo", "nrandom", "amauvingh"];
//# sourceMappingURL=App.js.map