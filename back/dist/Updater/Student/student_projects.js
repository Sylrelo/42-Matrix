"use strict";
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
const shared_1 = __importDefault(require("../../shared"));
const updateProject = (trx, cursusId, studentId, project) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const exists = yield shared_1.default
            .database("student_projects")
            .transacting(trx)
            .select("*")
            .where("student_id", studentId)
            .andWhere("cursus_id", cursusId)
            .andWhere("project_id", (_a = project === null || project === void 0 ? void 0 : project.project) === null || _a === void 0 ? void 0 : _a.id);
        const data = {
            student_id: studentId,
            cursus_id: cursusId,
            project_id: (_b = project === null || project === void 0 ? void 0 : project.project) === null || _b === void 0 ? void 0 : _b.id,
            validated: (_c = project === null || project === void 0 ? void 0 : project["validated?"]) !== null && _c !== void 0 ? _c : false,
            status: (_d = project === null || project === void 0 ? void 0 : project["status"]) !== null && _d !== void 0 ? _d : "unknown",
            validated_at: (project === null || project === void 0 ? void 0 : project.marked_at) ? new Date(project === null || project === void 0 ? void 0 : project.marked_at).getTime() : "0",
            tries: (_e = project.occurrence) !== null && _e !== void 0 ? _e : 0,
            final_mark: (_f = project.final_mark) !== null && _f !== void 0 ? _f : 0,
        };
        if (exists.length) {
            yield shared_1.default
                .database("student_projects")
                .transacting(trx)
                .update(data)
                .where("student_id", studentId)
                .andWhere("cursus_id", cursusId)
                .andWhere("project_id", (_g = project === null || project === void 0 ? void 0 : project.project) === null || _g === void 0 ? void 0 : _g.id);
        }
        else {
            yield shared_1.default.database("student_projects").transacting(trx).insert(data);
        }
        trx.commit;
    }
    catch (error) {
        trx.rollback;
        console.error(error);
    }
});
const updateStudentProjects = (projectData) => __awaiter(void 0, void 0, void 0, function* () {
    yield shared_1.default.database.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
        var _h;
        for (const studentId in projectData) {
            for (const project of projectData[studentId]) {
                for (const cursusOfProject of (_h = project.cursus_ids) !== null && _h !== void 0 ? _h : []) {
                    if (cursusOfProject !== 21)
                        continue; // temporary
                    yield updateProject(trx, cursusOfProject, +studentId, project);
                }
            }
        }
    }));
});
exports.default = updateStudentProjects;
//# sourceMappingURL=student_projects.js.map