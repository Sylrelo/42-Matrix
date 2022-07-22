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
exports.Location = void 0;
const security_1 = __importDefault(require("../Routes/security"));
const shared_1 = __importStar(require("../shared"));
const utils_1 = require("../utils");
const App_1 = require("../App");
class Location {
    constructor() {
        Location.actives = [];
    }
    Route(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply);
                const studentsId = Location.actives.map((location) => location.id);
                const suplData = (yield shared_1.COLLECTIONS.students
                    .find({ id: { $in: studentsId } })
                    .project({ groups: 1, coalition: 1, id: 1, matrix_is_pool: 1, cursus_users: 1, _id: 0 })
                    .toArray());
                const tmp = Location.actives.map((location) => {
                    var _a, _b;
                    const data = suplData.find((student) => student.id === location.id);
                    const grade = (_b = (_a = data === null || data === void 0 ? void 0 : data.cursus_users) === null || _a === void 0 ? void 0 : _a.find((cursus) => cursus.cursus_id === 21)) === null || _b === void 0 ? void 0 : _b.grade;
                    //@ts-ignore
                    console.log((data === null || data === void 0 ? void 0 : data.matrix_is_pool) ? null : grade);
                    return Object.assign(Object.assign({}, location), { groups: data === null || data === void 0 ? void 0 : data.groups, coalition: data === null || data === void 0 ? void 0 : data.coalition, 
                        //@ts-ignore
                        is_pool: data === null || data === void 0 ? void 0 : data.matrix_is_pool, 
                        //@ts-ignore
                        is_precc: (data === null || data === void 0 ? void 0 : data.matrix_is_pool) ? null : grade !== "Member" });
                });
                reply.code(200);
                reply.send(tmp);
            }
            catch (error) {
                console.error(error);
                reply.code(500);
                reply.send([]);
            }
        });
    }
    Update() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const studentLocations = [];
                let apiLocations = yield shared_1.default.api.getAll("campus/9/locations?filter[active]=true&filter[primary]=true", 100, 5, 30);
                apiLocations = (apiLocations !== null && apiLocations !== void 0 ? apiLocations : []).filter((value, index, self) => { var _a; return !((_a = value.user) === null || _a === void 0 ? void 0 : _a.id) || index === self.findIndex((t) => t.user.id === value.user.id); });
                for (const location of apiLocations) {
                    studentLocations.push(this.createDatabaseStudentObject(location));
                }
                const bulkOperations = [];
                Location.actives = [];
                for (const student of studentLocations) {
                    let updater = {};
                    if ((0, utils_1.isPool)(student)) {
                        updater = { matrix_is_pool: true };
                    }
                    bulkOperations.push({
                        updateOne: {
                            filter: { id: student.id },
                            update: { $set: Object.assign(Object.assign({}, student), updater) },
                            upsert: true,
                        },
                    });
                    Location.actives.push(student);
                }
                if (bulkOperations.length)
                    yield shared_1.COLLECTIONS.students.bulkWrite(bulkOperations);
                for (const student of studentLocations) {
                    App_1.student.UpdateOneStudent(student.id);
                }
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    createDatabaseStudentObject(location) {
        var _a, _b;
        return {
            id: location.user.id,
            login: location.user.login,
            image_url: location.user.image_url,
            new_image_url: location.user.new_image_url,
            display_name: location.user.displayname,
            correction_point: (_a = location.user.correction_point) !== null && _a !== void 0 ? _a : 0,
            wallet: (_b = location.user.wallet) !== null && _b !== void 0 ? _b : 0,
            pool_year: location.user.pool_year,
            pool_month: location.user.pool_month,
            last_seen: new Date().getTime(),
            location: location.host,
        };
    }
}
exports.Location = Location;
Location.actives = [];
//# sourceMappingURL=Location.js.map