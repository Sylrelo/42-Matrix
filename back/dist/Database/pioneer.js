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
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
const client = new mongodb_1.MongoClient(uri);
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield client.connect();
        const db = client.db("42matrix");
        const CSTUDENTS = db.collection("students");
        const CPROJECTS = db.collection("projects");
        const projectsByRealisationDate = {};
        const students = yield CSTUDENTS.find({}).toArray();
        for (const student of students) {
            for (const project of (_a = student.projects_users) !== null && _a !== void 0 ? _a : []) {
                // console.log(!project.marked_at, !project.marked, !project.cursus_ids.includes(21));
                // if (!project.project.name.includes("doom")) continue;
                if (project.final_mark === 0 ||
                    !project.marked_at ||
                    !project.marked ||
                    (!project.cursus_ids.includes(21) && !project.cursus_ids.includes(9))) {
                    continue;
                }
                const key = `${project.project.id} ${project.project.name}`;
                if (!projectsByRealisationDate[key])
                    projectsByRealisationDate[key] = [];
                projectsByRealisationDate[key].push({
                    login: student.login,
                    date: project.marked_at,
                });
            }
        }
        for (const project in projectsByRealisationDate) {
            projectsByRealisationDate[project].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            projectsByRealisationDate[project] = projectsByRealisationDate[project][0];
        }
        console.log(projectsByRealisationDate);
        // console.log(students.length);
        // console.log(STUDENTS);
        // const deleted = await Students.deleteMany({});
        // console.log("Done", deleted);
        yield client.close();
    }
    catch (error) {
        console.error(error);
        yield client.close();
    }
}))();
//# sourceMappingURL=pioneer.js.map