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
exports.Student = void 0;
const security_1 = __importDefault(require("../Routes/security"));
const shared_1 = __importStar(require("../shared"));
class Student {
    constructor() {
        this.isAlreadyUpdating = false;
        this.isAlreadyUpdatingInactive = false;
    }
    static RouteGetAllStudents(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply);
                const query = request.query;
                const time_start = new Date().getTime();
                const skills = yield shared_1.default.api.getAll(`cursus/21/skills?`, 30, 1, 160);
                let pipeline = [];
                if (query.skill_id && query.skill_level) {
                    pipeline.push({
                        $match: {
                            "cursus_users.skills": {
                                $elemMatch: {
                                    id: +query.skill_id,
                                    level: { $gte: +query.skill_level },
                                },
                            },
                        },
                    });
                }
                const basePipeline = [
                    {
                        $match: {
                            login: { $not: /3b3-/ },
                        },
                    },
                    {
                        $project: {
                            cursus_users: {
                                $filter: {
                                    input: "$cursus_users",
                                    as: "cursus",
                                    cond: {
                                        $eq: ["$$cursus.cursus_id", 21],
                                    },
                                },
                            },
                            login: 1,
                            id: 1,
                            image_url: 1,
                            wallet: 1,
                            correction_point: 1,
                            first_name: 1,
                            last_name: 1,
                            matrix_updated_at: 1,
                            last_seen: 1,
                            // projects_users: 1,
                            pool_year: 1,
                            pool_month: 1,
                        },
                    },
                    ...pipeline,
                ];
                let sort = {
                    $sort: {
                    // login: 1,
                    },
                };
                if (query.login_sort)
                    sort["$sort"].login = +query.login_sort;
                if (query.wallet_sort)
                    sort["$sort"].wallet = +query.wallet_sort;
                if (query.point_sort)
                    sort["$sort"].correction_point = +query.point_sort;
                if (query.level_sort)
                    sort["$sort"]["cursus_users.level"] = +query.level_sort;
                if (query.bh_sort)
                    sort["$sort"]["cursus_users.blackholed_at"] = +query.bh_sort;
                const students = yield shared_1.COLLECTIONS.students
                    .aggregate([
                    ...basePipeline,
                    Object.assign({}, sort),
                    // {
                    //     $sort: {
                    //         login: 1,
                    //         // "cursus_users.level": -1,
                    //     },
                    // },
                    {
                        $skip: query.page * 20,
                    },
                    {
                        $limit: 20,
                    },
                ])
                    .toArray();
                const total = yield shared_1.COLLECTIONS.students
                    .aggregate([...basePipeline, { $group: { _id: null, total: { $sum: 1 } } }])
                    .toArray();
                reply.send({ students, total: total[0].total, skills, time: new Date().getTime() - time_start });
            }
            catch (error) {
                console.error(error);
                reply.code(500);
                reply.send(error);
            }
        });
    }
    UpdateActive() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("[Student] Update Active Students", this.isAlreadyUpdating);
                if (this.isAlreadyUpdating)
                    return;
                this.isAlreadyUpdating = true;
                const students = (yield shared_1.COLLECTIONS.students
                    .find({
                    $and: [
                        { last_seen: { $gt: Student.lastseenTimeout } },
                        { matrix_updated_at: { $lt: Student.updateTimeout } },
                    ],
                })
                    .project({ id: 1 })
                    .toArray());
                if (students.length) {
                    yield this.updateDatabase(students);
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                this.isAlreadyUpdating = false;
            }
        });
    }
    UpdateInactive() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isAlreadyUpdatingInactive)
                    return;
                console.log("[Student] Update Inactive Students");
                this.isAlreadyUpdatingInactive = true;
                const students = (yield shared_1.COLLECTIONS.students
                    .find({
                    $or: [
                        { matrix_updated_at: 0 },
                        { matrix_updated_at: null },
                        { matrix_updated_at: { $exists: false } },
                    ],
                })
                    .project({ id: 1 })
                    .limit(50)
                    .toArray());
                if (students.length)
                    yield this.updateDatabase(students);
                console.log("Student.UpdateInactive : Done.");
            }
            catch (error) {
                console.error(error);
            }
            finally {
                this.isAlreadyUpdatingInactive = false;
            }
        });
    }
    UpdateWithCoalition() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Student.UpdateWitHCoaltion : Started.");
                const coalitions = yield shared_1.COLLECTIONS.coalitions
                    .find({})
                    .sort({ matrix_created_at: -1, id: 1 })
                    .project({ _id: 0, id: 1, color: 1, cursus_id: 1 })
                    .limit(6)
                    .toArray();
                for (const coalition of coalitions) {
                    const students = yield shared_1.default.api.getAll(`/coalitions/${coalition.id}/users?`, 100);
                    const bulkOperations = [];
                    for (const student of students) {
                        let filter = {};
                        if (coalition.cursus_id === 21) {
                            filter = { $or: [{ matrix_is_pool: false }, { matrix_is_pool: { $exists: false } }] };
                        }
                        else if (coalition.cursus_id === 9) {
                            filter = { matrix_is_pool: true };
                        }
                        bulkOperations.push({
                            updateOne: {
                                filter: Object.assign({ id: student.id }, filter),
                                update: { $set: Object.assign(Object.assign({}, student), { coalition: coalition }) },
                            },
                        });
                    }
                    if (bulkOperations.length)
                        yield shared_1.COLLECTIONS.students.bulkWrite(bulkOperations);
                    console.log("Student.UpdateWitHCoaltion : Done.");
                }
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    GetAllStudents() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Student.GetAllStudents");
                const students = yield shared_1.default.api.getAll("achievements/218/users?filter[primary_campus_id]=9", 100, 1, 30);
                console.log(`Student's count : `, students.length);
                const transaction = [];
                for (const student of students) {
                    transaction.push({
                        updateOne: {
                            filter: { id: student.id },
                            update: { $set: Object.assign({}, student) },
                            upsert: true,
                        },
                    });
                }
                if (transaction.length)
                    yield shared_1.COLLECTIONS.students.bulkWrite(transaction);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    updateDatabase(students) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = [];
                console.log(students.length, "to update.");
                for (const student of students) {
                    const studentData = (yield shared_1.default.api.get("users/" + student.id));
                    studentData === null || studentData === void 0 ? true : delete studentData.campus;
                    studentData === null || studentData === void 0 ? true : delete studentData.languages_users;
                    studentData === null || studentData === void 0 ? true : delete studentData.patroning;
                    studentData === null || studentData === void 0 ? true : delete studentData.patroned;
                    studentData === null || studentData === void 0 ? true : delete studentData.phone;
                    studentData === null || studentData === void 0 ? true : delete studentData.usual_first_name;
                    studentData === null || studentData === void 0 ? true : delete studentData.usual_full_name;
                    studentData === null || studentData === void 0 ? true : delete studentData.partnerships;
                    studentData === null || studentData === void 0 ? true : delete studentData.email;
                    studentData === null || studentData === void 0 ? true : delete studentData.expertises_users;
                    transaction.push({
                        updateOne: {
                            filter: { id: student.id },
                            update: { $set: Object.assign(Object.assign({}, studentData), { matrix_updated_at: new Date().getTime() }) },
                        },
                    });
                }
                if (transaction.length)
                    yield shared_1.COLLECTIONS.students.bulkWrite(transaction);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
exports.Student = Student;
Student.updateTimeout = new Date().getTime() - 24 * 3600 * 1000;
Student.lastseenTimeout = new Date().getTime() - 7 * 24 * 3600 * 1000;
//# sourceMappingURL=Student.js.map