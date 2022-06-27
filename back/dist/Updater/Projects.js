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
exports.Project = void 0;
const security_1 = __importDefault(require("../Routes/security"));
const shared_1 = __importStar(require("../shared"));
class Project {
    static GetProjectDetail(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield security_1.default.checkAuth(request, reply);
                if (student.is_pool) {
                    reply.code(402);
                    reply.send({});
                    return;
                }
                const params = request.params;
                const project = yield shared_1.COLLECTIONS.projects.findOne({ id: +params.id });
                const students = yield shared_1.COLLECTIONS.students
                    .aggregate([
                    {
                        $match: { "projects_users.project.id": +params.id },
                    },
                    {
                        $project: {
                            login: 1,
                            image_url: 1,
                            projects_users: {
                                $filter: {
                                    input: "$projects_users",
                                    as: "projects_user",
                                    cond: { $eq: ["$$projects_user.project.id", +params.id] },
                                },
                            },
                        },
                    },
                    {
                        $addFields: { project: { $first: "$projects_users" } },
                    },
                    {
                        $project: {
                            projects_users: 0,
                        },
                    },
                ])
                    .toArray();
                reply.send({ project, students });
            }
            catch (error) {
                console.error(error);
                reply.code(500);
                reply.send(error);
            }
        });
    }
    static GetProjects(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield security_1.default.checkAuth(request, reply);
                if (student.is_pool) {
                    reply.code(402);
                    reply.send({});
                    return;
                }
                const projects = yield shared_1.COLLECTIONS.projects
                    .aggregate([
                    {
                        $project: {
                            _id: 0,
                            name: 1,
                            id: 1,
                            parent: 1,
                            project_session: { $first: "$project_sessions" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            name: 1,
                            id: 1,
                            "parent.id": 1,
                            "parent.difficulty": 1,
                            "project_session.estimate_time": 1,
                            "project_session.difficulty": 1,
                        },
                    },
                ])
                    .toArray();
                const studentProjects = yield shared_1.COLLECTIONS.students
                    .aggregate([
                    {
                        $project: {
                            projects_users: 1,
                        },
                    },
                    {
                        $unwind: "$projects_users",
                    },
                    {
                        $group: {
                            _id: {
                                project_id: "$projects_users.project.id",
                                status: "$projects_users.status",
                            },
                            count: {
                                $sum: 1,
                            },
                        },
                    },
                ])
                    .toArray();
                reply.send({ projects, studentProjects });
            }
            catch (error) {
                console.error(error);
                reply.code(500);
                reply.send(error);
            }
        });
    }
    static Update() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lastUpdate = yield shared_1.COLLECTIONS.projects.findOne({ type: "matrix_update" });
                const projects = yield shared_1.default.api.getAllOffset("cursus/21/projects?sort=-created_at", 50, (_a = lastUpdate === null || lastUpdate === void 0 ? void 0 : lastUpdate.matrix_last_page) !== null && _a !== void 0 ? _a : 1, 1);
                const bulkOperations = [];
                for (const project of projects.data) {
                    delete project.campus;
                    bulkOperations.push({
                        updateOne: {
                            filter: { id: project.id },
                            update: { $set: project },
                            upsert: true,
                        },
                    });
                }
                if (bulkOperations.length)
                    yield shared_1.COLLECTIONS.projects.bulkWrite(bulkOperations);
                yield shared_1.COLLECTIONS.projects.updateOne({ type: "matrix_update" }, {
                    $set: {
                        matrix_last_page: projects.page,
                    },
                }, { upsert: true });
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
exports.Project = Project;
//# sourceMappingURL=Projects.js.map