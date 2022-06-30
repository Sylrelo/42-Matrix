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
exports.studentRoute = void 0;
const shared_1 = __importDefault(require("../shared"));
const studentRoute = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const studentId = request.params.id;
        const student = yield shared_1.default.database("Students").where("id", studentId);
        const cursus = yield shared_1.default.database("Cursus_level").where("student_id", studentId).andWhere("cursus_id", 21);
        const projects = yield shared_1.default
            .database("student_projects")
            .where("student_id", studentId)
            .andWhere("cursus_id", 21)
            .join("projects", "projects.id", "student_projects.project_id");
        const asCorrected = yield shared_1.default
            .database("correction_cluster")
            .select("correction_cluster.*", "projects.name")
            .where("corrected", studentId)
            .join("projects", "projects.id", "correction_cluster.project_id");
        const asCorrector = yield shared_1.default
            .database("correction_cluster")
            .select("correction_cluster.*", "projects.name")
            .where("corrector", studentId)
            .join("projects", "projects.id", "correction_cluster.project_id");
        // await security.checkAuth(request, reply);
        // const cachedResponse = await shared.cache.get("StatusRoute");
        // if (cachedResponse) {
        //     reply.send(cachedResponse);
        // }
        // shared.cache.set("StatusRoute", finalStatus, 10);
        reply.code(200);
        reply.send({
            student: student[0],
            cursus: cursus[0],
            correctionCluster: { asCorrected, asCorrector },
            projects,
        });
    }
    catch (error) {
        console.error(error);
        reply.code(400);
        reply.send({ error: "Authotization failure." });
    }
});
exports.studentRoute = studentRoute;
//# sourceMappingURL=student.js.map