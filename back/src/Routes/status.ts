import { FastifyReply, FastifyRequest } from "fastify";
import shared, { COLLECTIONS } from "../shared";
import fs from "fs";
import security from "./security";
import { Student } from "../Updater/Student";

export const statusHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const student = await security.checkAuth(request, reply);

        if (student.is_pool) {
            reply.code(402);
            reply.send({});
            return;
        }

        const projectsCount = await COLLECTIONS.projects.count({});

        const recentlySeen = await COLLECTIONS.students.count({ last_seen: { $gt: Student.lastseenTimeout } });

        const activeUpdatePendingCount = await COLLECTIONS.students.count({
            $and: [
                { last_seen: { $lt: Student.lastseenTimeout } },
                { matrix_updated_at: { $gt: Student.updateTimeout } },
            ],
        });

        const inactiveUpdatePendingCount = await COLLECTIONS.students.count({
            $or: [{ matrix_updated_at: 0 }, { matrix_updated_at: null }, { matrix_updated_at: { $exists: false } }],
        });

        const stalkingStudent = await COLLECTIONS.sessions.count({
            last_access: { $gte: new Date().getTime() - 30 * 1000 },
        });

        const totalStudent = await COLLECTIONS.students.count({});

        const dbStats = await shared.mongo.db("42matrix").stats();

        reply.code(200);
        reply.send({
            ...shared.status,
            pendingRequest: shared.api.getTotalPendingRequest(),
            recentlySeen,
            activeUpdatePendingCount,
            inactiveUpdatePendingCount,
            totalStudent,
            stalkingStudent,
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
