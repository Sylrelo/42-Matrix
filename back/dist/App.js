"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = exports.coalition = exports.location = exports.student = void 0;
const Coalitions_1 = require("./Updater/Coalitions");
const Location_1 = require("./Updater/Location");
const Student_1 = require("./Updater/Student");
exports.student = new Student_1.Student();
exports.location = new Location_1.Location();
exports.coalition = new Coalitions_1.Coalition();
exports.CONFIG = { CLIENT_SECRET: "" };
//# sourceMappingURL=App.js.map