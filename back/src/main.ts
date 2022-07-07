import dotenv from "dotenv";
import Fastify from "fastify";
import { readFile } from "fs";
import { AnyBulkWriteOperation } from "mongodb";
import NodeCache from "node-cache";
import schedule from "node-schedule";
import FortyTwo from "./42";
import { coalition, CONFIG, location, student } from "./App";
import { Admin } from "./Routes/admin";
import { authHandler, authVerifyHandler, logoutHandler } from "./Routes/authenticate";
import { RankingRoute } from "./Routes/ranking";
import { statusHandler } from "./Routes/status";
import shared, { COLLECTIONS } from "./shared";
import { Stats } from "./status";
import { Project } from "./Updater/Projects";
import { Student, StudentRoute } from "./Updater/Student";

dotenv.config({ path: ".env.local" });
dotenv.config();

const fastify = Fastify({
    logger: false,
});

fastify.register(require("fastify-cors"), {
    // origin: true,
});

fastify.register(require("fastify-compress"));

fastify.addHook("onResponse", async (request, reply) => {
    Stats.Add("matrixRequests", reply.getResponseTime());
});

// fastify.get("/api/student/:id", studentRoute);
fastify.post("/api/admin/change_secret", Admin.ChangeSecret);
fastify.post("/api/admin/restart", Admin.Restart);
fastify.post("/api/admin/pull", Admin.Pull);
fastify.get("/api/admin/logs", Admin.GetLogs);

fastify.get("/api/students", Student.RouteGetAllStudents);
fastify.get("/api/student/:id", StudentRoute.GetOne);

fastify.get("/api/locations", location.Route);
fastify.get("/api/coalitions", coalition.Route);

fastify.get("/api/ranking", RankingRoute);

fastify.post("/api/auth_42", authHandler);
fastify.post("/api/auth_verify", authVerifyHandler);
fastify.post("/api/logout", logoutHandler);

fastify.get("/api/projects", Project.GetProjects);
fastify.get("/api/project/:id", Project.GetProjectDetail);

fastify.get("/api/status", statusHandler);

(async () => {
    try {
        try {
            const localConfig: Buffer = await new Promise((resolve, reject) => {
                readFile(".localConfig.json", (err, data) => {
                    if (err) reject(err);
                    resolve(data);
                });
            });

            const json = JSON.parse(localConfig.toString());
            CONFIG.CLIENT_SECRET = json?.secret;
        } catch (_) {}

        CONFIG.CLIENT_SECRET = process.env.SECRET;

        await shared.mongo.connect();

        const db = shared.mongo.db("42matrix");

        COLLECTIONS.students = db.collection("students");
        COLLECTIONS.coalitions = db.collection("coalitions");
        COLLECTIONS.sessions = db.collection("sessions");
        COLLECTIONS.projects = db.collection("projects");
        COLLECTIONS.logs = db.collection("logs");

        await COLLECTIONS.students.createIndex({ login: 1 });
        await COLLECTIONS.students.createIndex({ login: -1 });

        shared.cache = new NodeCache({ stdTTL: 3600 });
        shared.api = new FortyTwo();
        await shared.api.getToken();
        shared.api.handlePending();

        // console.log(await shared.api.get("campus/9/events?sort=-begin_at"));
        // await shared.api.getAll<any[]>("events/10713/events_users?");

        const studs = await COLLECTIONS.students.find({ "cursus_users.blackholed_at": { $exists: true } }).toArray();
        const transaction: AnyBulkWriteOperation[] = [];
        for (const stud of studs) {
            const cursuses = stud.cursus_users ?? [];
            for (const cursus of cursuses) {
                if (cursus.blackholed_at) cursus.blackholed_at = new Date(cursus.blackholed_at);
            }

            transaction.push({
                updateOne: {
                    filter: { id: stud.id },
                    update: { $set: { cursus_users: cursuses } },
                },
            });
        }
        if (transaction.length) await COLLECTIONS.students.bulkWrite(transaction);

        setInterval(async () => {
            const stalkingStudent = await COLLECTIONS.sessions.countDocuments({
                last_access: { $gte: new Date().getTime() - 30 * 1000 },
            });

            Stats.Add("stalking", stalkingStudent);
        }, 5000);

        startJobs();
        console.log("Jobs started.");
        await location.Update();

        if ((await COLLECTIONS.coalitions.countDocuments({ cursus_id: 21 })) < 3) {
            await coalition.Update(21);
        }

        if ((await COLLECTIONS.coalitions.countDocuments({ cursus_id: 9 })) < 3) {
            await coalition.Update(9);
        }

        if ((await COLLECTIONS.students.countDocuments({})) < 400) {
            await student.GetAllStudents();
            student.UpdateWithCoalition();
            student.UpdateInactive();
            console.log("Initialisation GetAllStudents() done.");
        }

        if ((await COLLECTIONS.projects.countDocuments({})) === 0) {
            await Project.Update();
            console.log("Initialisation project.Update() done.");
        }
    } catch (error) {
        console.error(error);
        await shared.mongo.close();
    }
})();

function startJobs() {
    // Every 10 minutes
    schedule.scheduleJob("*/10 * * * *", () => {
        student.UpdateInactive();
        student.UpdateActive();
    });

    // Everyday at 23h42
    schedule.scheduleJob("42 23 * * *", () => {
        coalition.Update(21);
        coalition.Update(9);
    });

    // Every sunday
    schedule.scheduleJob("0 6 * * *", () => {
        Project.Update();
    });

    // Every month at 4 am
    schedule.scheduleJob("0 4 * 1-12 *", () => {
        student.UpdateWithCoalition();
        student.GetAllStudents();
    });

    setInterval(() => {
        location.Update();
    }, 10000);

    setInterval(() => {
        shared.api.getToken();
    }, 2000);
}

fastify.listen(8080, (err, address) => {
    if (err) throw err;
    console.log(address);
});
