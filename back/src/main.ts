import Fastify from "fastify";
import NodeCache from "node-cache";
import schedule from "node-schedule";
import FortyTwo from "./42";
import { coalition, location, student } from "./App";
import { authHandler, authVerifyHandler, logoutHandler } from "./Routes/authenticate";
import { RankingRoute } from "./Routes/ranking";
import { statusHandler } from "./Routes/status";
import shared, { COLLECTIONS } from "./shared";
import { addMatrixApiRequestStat } from "./status";
import { Project } from "./Updater/Projects";
import dotenv from "dotenv";
import { Student } from "./Updater/Student";

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
    addMatrixApiRequestStat(reply.getResponseTime());
});

// fastify.get("/api/student/:id", studentRoute);
// fastify.get("/api/admin", adminRoute);

fastify.get("/api/students", Student.RouteGetAllStudents);

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
        await shared.mongo.connect();

        const db = shared.mongo.db("42matrix");

        COLLECTIONS.students = db.collection("students");
        COLLECTIONS.coalitions = db.collection("coalitions");
        COLLECTIONS.sessions = db.collection("sessions");
        COLLECTIONS.projects = db.collection("projects");
        COLLECTIONS.logs = db.collection("logs");

        shared.cache = new NodeCache({ stdTTL: 3600 });
        shared.api = new FortyTwo();
        await shared.api.getToken();
        shared.api.handlePending();

        student.UpdateActive();

        startJobs();
        console.log("Jobs started.");
        location.Update();

        if ((await COLLECTIONS.coalitions.countDocuments({ cursus_id: 21 })) < 3) {
            coalition.Update(21);
        }

        if ((await COLLECTIONS.coalitions.countDocuments({ cursus_id: 9 })) < 3) {
            coalition.Update(9);
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
