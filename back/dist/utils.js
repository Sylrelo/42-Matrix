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
    var _a, _b;
    return ((((_a = user === null || user === void 0 ? void 0 : user.cursus_users) === null || _a === void 0 ? void 0 : _a.length) === 1 && ((_b = user === null || user === void 0 ? void 0 : user.cursus_users) === null || _b === void 0 ? void 0 : _b.find((cursus) => cursus.cursus_id === 9)) != null) ||
        (user.pool_month === exports.MONTHS_NAME[new Date().getMonth()].toLowerCase() &&
            user.pool_year === new Date().getFullYear().toString()));
};
exports.isPool = isPool;
//# sourceMappingURL=utils.js.map