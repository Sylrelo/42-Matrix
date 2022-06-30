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
exports.projectDetailRoute = exports.projectsListRoute = void 0;
const shared_1 = __importDefault(require("../shared"));
const security_1 = __importDefault(require("./security"));
const projectsListRoute = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield security_1.default.checkAuth(request, response);
        const cachedResponse = yield shared_1.default.cache.get("projectsListRoute");
        if (cachedResponse) {
            response.send(cachedResponse);
        }
        const projects = yield shared_1.default.database.raw("SELECT p.id, p.name, p.slug, p.xp, p2.name AS parent_name, p2.id AS parent_id, p2.xp AS parent_xp \
            FROM projects AS p \
            LEFT JOIN projects AS p2 ON p2.id = p.parent");
        const projectUsers = yield shared_1.default
            .database("student_projects")
            .select("status", "project_id")
            .count("project_id AS total")
            .where("cursus_id", 21)
            .orderBy("project_id")
            .groupBy("project_id", "status");
        let projectList = {};
        for (const project of projects) {
            const students = projectUsers.filter((users) => users.project_id === project.id);
            if (project.parent_id == null) {
                projectList[project.id] = Object.assign(Object.assign({}, project), { students, childrens: [] });
            }
            else {
                if (projectList[project.parent_id] == null) {
                    projectList[project.parent_id] = Object.assign(Object.assign({}, project), { students, childrens: [] });
                }
                projectList[project.parent_id].childrens.push(Object.assign({ students }, project));
            }
        }
        const projectsArray = Object.values(projectList);
        projectsArray.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        shared_1.default.cache.set("projectsListRoute", projectsArray !== null && projectsArray !== void 0 ? projectsArray : [], 60);
        response.send(projectsArray);
    }
    catch (error) {
        console.error(error);
        response.send({});
    }
});
exports.projectsListRoute = projectsListRoute;
const projectDetailRoute = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const projectId = request.params.id;
        const cachedResponse = yield shared_1.default.cache.get("projectDetailsRoute-" + projectId);
        if (cachedResponse) {
            response.send(cachedResponse);
        }
        const project = (yield shared_1.default.database("projects").where("id", projectId)).at(0);
        const students = yield shared_1.default
            .database("student_projects")
            .select("*")
            .join("Students AS s", "s.id", "=", "student_id")
            .where("project_id", projectId)
            .andWhere("cursus_id", 21);
        // const projectApi = await shared.api.getAll<any[]>(
        //     `projects/${projectId}/projects_users?filter[cursus]=21&filter[campus]=9`,
        //     100,
        //     1,
        //     30
        // );
        // console.log(projectApi.length, project.length);
        shared_1.default.cache.set("projectDetailsRoute-" + projectId, Object.assign(Object.assign({}, project), { students }), 160);
        response.send(Object.assign(Object.assign({}, project), { students }));
    }
    catch (error) {
        console.error(error);
    }
});
exports.projectDetailRoute = projectDetailRoute;
//# sourceMappingURL=projects.js.map