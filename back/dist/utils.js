"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPool = exports.MONTHS_NAME = void 0;
exports.MONTHS_NAME = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const isPool = (user) => {
    return (user.pool_month === exports.MONTHS_NAME[new Date().getMonth()].toLowerCase() &&
        user.pool_year === new Date().getFullYear().toString());
};
exports.isPool = isPool;
//# sourceMappingURL=utils.js.map