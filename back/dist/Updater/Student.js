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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const shared_1 = __importStar(require("../shared"));
class Student {
    constructor() {
        this.isAlreadyUpdating = false;
        this.isAlreadyUpdatingInactive = false;
    }
    UpdateActive() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isAlreadyUpdating)
                    return;
                console.log("[Student] Update Active Students");
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
                    .limit(15)
                    .toArray());
                if (students.length) {
                    yield this.updateDatabase(students);
                }
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
                const coalitions = yield shared_1.COLLECTIONS.coalitions
                    .find({})
                    .sort({ matrix_created_at: -1, id: 1 })
                    .project({ _id: 0, id: 1, color: 1 })
                    .limit(3)
                    .toArray();
                for (const coalition of coalitions) {
                    const students = yield shared_1.default.api.getAll(`/coalitions/${coalition.id}/users?`, 100);
                    const bulkOperations = [];
                    for (const student of students) {
                        bulkOperations.push({
                            updateOne: {
                                filter: { id: student.id },
                                update: { $set: Object.assign(Object.assign({}, student), { coalition: coalition }) },
                                upsert: true,
                            },
                        });
                    }
                    if (bulkOperations.length)
                        yield shared_1.COLLECTIONS.students.bulkWrite(bulkOperations);
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
                    studentData === null || studentData === void 0 ? true : delete studentData.expertises_users;
                    studentData === null || studentData === void 0 ? true : delete studentData.patroning;
                    studentData === null || studentData === void 0 ? true : delete studentData.patroned;
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