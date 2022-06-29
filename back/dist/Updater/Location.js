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
class Location {
    constructor() {
        Location.actives = [];
    }
    Route(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply);
                // await location.Update();
                const studentsId = Location.actives.map((location) => location.id);
                const suplData = (yield shared_1.COLLECTIONS.students
                    .find({ id: { $in: studentsId } })
                    .project({ groups: 1, coalition: 1, id: 1, _id: 0 })
                    .toArray());
                const tmp = Location.actives.map((location) => {
                    var _a, _b;
                    return (Object.assign(Object.assign({}, location), { groups: (_a = suplData.find((student) => student.id === location.id)) === null || _a === void 0 ? void 0 : _a.groups, coalition: (_b = suplData.find((student) => student.id === location.id)) === null || _b === void 0 ? void 0 : _b.coalition }));
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
                // apiLocations.push({
                //     end_at: "",
                //     id: 9999999,
                //     begin_at: "",
                //     primary: true,
                //     host: "z3r5p2",
                //     campus_id: 9999999,
                //     user: {
                //         pool_month: "june",
                //         pool_year: "2022",
                //         id: 9999999,
                //         login: "pool test",
                //         image_url:
                //             "https://www.gannett-cdn.com/-mm-/e6db794ee53cd5604c71d33cdc4e1c2d8dd1e9f6/c=0-97-3000-1792/local/-/media/2016/05/28/Phoenix/Phoenix/636000630435534109-uscpcent02-6pxapvk0nu0vrw8pa7y-original.jpg",
                //     },
                // });
                // apiLocations.push({
                //     end_at: "",
                //     id: 99991,
                //     begin_at: "",
                //     primary: true,
                //     host: "z3r5p6",
                //     campus_id: 99991,
                //     user: {
                //         pool_month: "june",
                //         pool_year: "2022",
                //         id: 999991,
                //         login: "999994",
                //         image_url:
                //             "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
                //     },
                // });
                apiLocations = (apiLocations !== null && apiLocations !== void 0 ? apiLocations : []).filter((value, index, self) => { var _a; return !((_a = value.user) === null || _a === void 0 ? void 0 : _a.id) || index === self.findIndex((t) => t.user.id === value.user.id); });
                for (const location of apiLocations) {
                    studentLocations.push(this.createDatabaseStudentObject(location));
                }
                const bulkOperations = [];
                Location.actives = [];
                for (const student of studentLocations) {
                    bulkOperations.push({
                        updateOne: {
                            filter: { id: student.id },
                            update: { $set: Object.assign(Object.assign({}, student), { matrix_is_pool: (0, utils_1.isPool)(student) }) },
                            upsert: true,
                        },
                    });
                    Location.actives.push(student);
                }
                if (bulkOperations.length)
                    yield shared_1.COLLECTIONS.students.bulkWrite(bulkOperations);
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