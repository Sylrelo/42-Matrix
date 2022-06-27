import { createHash, randomUUID } from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import Sessions from "../Database/Sessions";
import shared, { COLLECTIONS } from "../shared";
import security from "./security";

export const authHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    //@ts-ignore
    const accessCode = request.body?.code;

    // A typer correctement
    try {
        const response = await shared.api.authorisationPost<Record<string, any>>(accessCode);

        const student = await shared.api.getUser<Record<string, any>>(response.access_token, "me");

        if (student?.["alumni?"]) {
            reply.code(401);
            reply.send({ error: "Your access to the 42 intranet is revoked." });
            return;
        }

        if (!student?.campus_users?.find((campus) => campus.campus_id === 9)) {
            reply.code(401);
            reply.send({ error: "Your do not belong to the 42 Lyon campus." });
            return;
        }

        const isPool = !(student.cursus_users?.filter(
            (cursus) => !cursus.cursus?.name?.toLowerCase()?.includes("piscine")
        )).length;

        const uid = randomUUID();
        const currentTime = new Date().getTime();
        const ipHash = createHash("sha256").update(request.ip).digest("hex");

        await COLLECTIONS.sessions.insertOne({
            uid,
            student_id: student.id,
            created_at: currentTime,
            last_access: currentTime,
            ip_hash: ipHash,
            is_temporary: isPool,
        });

        reply.code(200);
        reply.send({ access: response, student, uid });
    } catch (error) {
        reply.code(400);
        reply.send({ error: "Authotization failure." });
    }
};

export const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const uid = request.headers?.authorization;
        await COLLECTIONS.sessions.deleteOne({ uid });
    } finally {
        reply.code(200);
        reply.send({});
    }
};

export const authVerifyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const student = await security.checkAuth(request, reply);

        reply.code(200);
        reply.send(student);
    } catch (error) {
        console.error(error);
        reply.code(400);
        reply.send({ error: "Authotization failure." });
    }
};
