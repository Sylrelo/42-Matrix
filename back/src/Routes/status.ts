import { FastifyReply, FastifyRequest } from "fastify";
import shared, { COLLECTIONS } from "../shared";
import fs from "fs";
import security from "./security";
import { Student } from "../Updater/Student";
import { Stats } from "../status";

export const statusHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const student = await security.checkAuth(request, reply);

        if (student.is_pool) {
            reply.code(402);
            reply.send({});
            return;
        }

        const projectsCount = await COLLECTIONS.projects.countDocuments({});

        const recentlySeen = await COLLECTIONS.students.countDocuments({ last_seen: { $gt: Student.lastseenTimeout } });

        const activeUpdatePendingCount = await COLLECTIONS.students.countDocuments({
            $and: [
                { last_seen: { $gt: Student.lastseenTimeout } },
                { matrix_updated_at: { $lt: Student.updateTimeout } },
            ],
        });

        const updateInTheLastDay = await COLLECTIONS.students.countDocuments({
            matrix_updated_at: { $gt: Student.updateTimeout },
        });

        const inactiveUpdatePendingCount = await COLLECTIONS.students.countDocuments({
            $or: [{ matrix_updated_at: 0 }, { matrix_updated_at: null }, { matrix_updated_at: { $exists: false } }],
        });

        const stalkingStudent = await COLLECTIONS.sessions.countDocuments({
            last_access: { $gte: new Date().getTime() - 30 * 1000 },
        });

        const totalStudent = await COLLECTIONS.students.countDocuments({});

        const dbStats = await shared.mongo.db("42matrix").stats();

        reply.code(200);
        reply.send({
            stats: Stats.Get(),
            pendingRequest: shared.api.getTotalPendingRequest(),
            recentlySeen,
            activeUpdatePendingCount,
            inactiveUpdatePendingCount,
            totalStudent,
            stalkingStudent,
            updateInTheLastDay,
            dataSize: dbStats.dataSize,
            storageSize: dbStats.storageSize,
            projectsCount: projectsCount - 1,
        });
    } catch (error) {
        console.error(error);
        reply.code(400);
        reply.send({ error: "Authotization failure." });
    }
};
