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
const dotenv_1 = __importDefault(require("dotenv"));
const fastify_1 = __importDefault(require("fastify"));
const fs_1 = require("fs");
const node_cache_1 = __importDefault(require("node-cache"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const _42_1 = __importDefault(require("./42"));
const App_1 = require("./App");
const admin_1 = require("./Routes/admin");
const authenticate_1 = require("./Routes/authenticate");
const lastActions_1 = require("./Routes/lastActions");
const ranking_1 = require("./Routes/ranking");
const status_1 = require("./Routes/status");
const shared_1 = __importStar(require("./shared"));
const status_2 = require("./status");
const Projects_1 = require("./Updater/Projects");
const Student_1 = require("./Updater/Student");
dotenv_1.default.config({ path: ".env.local" });
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({
    logger: false,
});
fastify.register(require("fastify-cors"), {
// origin: true,
});
fastify.register(require("fastify-compress"));
fastify.addHook("onResponse", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    status_2.Stats.Add("matrixRequests", reply.getResponseTime());
}));
// fastify.get("/api/student/:id", studentRoute);
fastify.post("/api/admin/change_secret", admin_1.Admin.ChangeSecret);
fastify.post("/api/admin/restart", admin_1.Admin.Restart);
fastify.post("/api/admin/pull", admin_1.Admin.Pull);
fastify.get("/api/admin/logs", admin_1.Admin.GetLogs);
fastify.get("/api/students", Student_1.Student.RouteGetAllStudents);
fastify.get("/api/student/:id", Student_1.StudentRoute.GetOne);
fastify.get("/api/actions", lastActions_1.LastActionsRoute.Get);
fastify.get("/api/locations", App_1.location.Route);
fastify.get("/api/coalitions", App_1.coalition.Route);
fastify.get("/api/ranking", ranking_1.RankingRoute);
fastify.post("/api/auth_42", authenticate_1.authHandler);
fastify.post("/api/auth_verify", authenticate_1.authVerifyHandler);
fastify.post("/api/logout", authenticate_1.logoutHandler);
fastify.get("/api/projects", Projects_1.Project.GetProjects);
fastify.get("/api/project/:id", Projects_1.Project.GetProjectDetail);
fastify.get("/api/status", status_1.statusHandler);
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        try {
            const localConfig = yield new Promise((resolve, reject) => {
                (0, fs_1.readFile)(".localConfig.json", (err, data) => {
                    if (err)
                        reject(err);
                    resolve(data);
                });
            });
            const json = JSON.parse(localConfig.toString());
            App_1.CONFIG.CLIENT_SECRET = json === null || json === void 0 ? void 0 : json.secret;
        }
        catch (_) { }
        App_1.CONFIG.CLIENT_SECRET = process.env.SECRET;
        yield shared_1.default.mongo.connect();
        const db = shared_1.default.mongo.db("42matrix");
        // await db.authenticate("root", "example");
        shared_1.COLLECTIONS.students = db.collection("students");
        shared_1.COLLECTIONS.coalitions = db.collection("coalitions");
        shared_1.COLLECTIONS.sessions = db.collection("sessions");
        shared_1.COLLECTIONS.projects = db.collection("projects");
        shared_1.COLLECTIONS.logs = db.collection("logs");
        yield shared_1.COLLECTIONS.students.createIndex({ login: 1 });
        yield shared_1.COLLECTIONS.students.createIndex({ login: -1 });
        shared_1.default.cache = new node_cache_1.default({ stdTTL: 3600 });
        shared_1.default.api = new _42_1.default();
        yield shared_1.default.api.getToken();
        shared_1.default.api.handlePending();
        // student.UpdateInactive();
        // setInterval(() => {
        //     student.UpdateInactive();
        // }, 180000);
        // setTimeout(() => {
        //     student.GetAllStudents();
        // }, 4000);
        // return;
        // COLLECTIONS.sessions.deleteMany({});
        // // console.log(await shared.api.get("campus/9/events?sort=-begin_at"));
        // const allo = await shared.api.get<any>("events/10713/events_users");
        // console.log(allo);
        // return;
        const studs = yield shared_1.COLLECTIONS.students.find({ "cursus_users.blackholed_at": { $exists: true } }).toArray();
        const transaction = [];
        for (const stud of studs) {
            const cursuses = (_a = stud.cursus_users) !== null && _a !== void 0 ? _a : [];
            for (const cursus of cursuses) {
                if (cursus.blackholed_at)
                    cursus.blackholed_at = new Date(cursus.blackholed_at);
            }
            transaction.push({
                updateOne: {
                    filter: { id: stud.id },
                    update: { $set: { cursus_users: cursuses } },
                },
            });
        }
        if (transaction.length)
            yield shared_1.COLLECTIONS.students.bulkWrite(transaction);
        setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const stalkingStudent = yield shared_1.COLLECTIONS.sessions.countDocuments({
                last_access: { $gte: new Date().getTime() - 30 * 1000 },
            });
            status_2.Stats.Add("stalking", stalkingStudent);
        }), 5000);
        startJobs();
        console.log("Jobs started.");
        yield App_1.location.Update();
        if ((yield shared_1.COLLECTIONS.coalitions.countDocuments({ cursus_id: 21 })) < 3) {
            yield App_1.coalition.Update(21);
        }
        if ((yield shared_1.COLLECTIONS.coalitions.countDocuments({ cursus_id: 9 })) < 3) {
            yield App_1.coalition.Update(9);
        }
        if ((yield shared_1.COLLECTIONS.students.countDocuments({})) < 400) {
            yield App_1.student.GetAllStudents();
            App_1.student.UpdateWithCoalition();
            App_1.student.UpdateInactive();
            console.log("Initialisation GetAllStudents() done.");
        }
        if ((yield shared_1.COLLECTIONS.projects.countDocuments({})) === 0) {
            yield Projects_1.Project.Update();
            console.log("Initialisation project.Update() done.");
        }
    }
    catch (error) {
        console.error(error);
        yield shared_1.default.mongo.close();
    }
}))();
function startJobs() {
    // Every 10 minutes
    node_schedule_1.default.scheduleJob("*/10 * * * *", () => {
        App_1.student.UpdateInactive();
        App_1.student.UpdateActive();
    });
    // Everyday at 23h42
    node_schedule_1.default.scheduleJob("42 23 * * *", () => {
        App_1.coalition.Update(21);
        App_1.coalition.Update(9);
    });
    // Every sunday
    node_schedule_1.default.scheduleJob("0 6 * * *", () => {
        Projects_1.Project.Update();
    });
    // Every month at 4 am
    node_schedule_1.default.scheduleJob("0 4 * 1-12 *", () => {
        App_1.student.UpdateWithCoalition();
        App_1.student.GetAllStudents();
    });
    setInterval(() => {
        App_1.location.Update();
    }, 10000);
    setInterval(() => {
        shared_1.default.api.getToken();
    }, 2000);
}
fastify.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
    if (err)
        throw err;
    console.log(address);
});
//# sourceMappingURL=main.js.map