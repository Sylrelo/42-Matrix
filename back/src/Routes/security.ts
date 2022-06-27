import { createHash } from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import { COLLECTIONS } from "../shared";

const isUidValid = async (
    request: FastifyRequest,
    uid: string,
    authorizedStudent: number[] = []
): Promise<null | Record<string, any>> => {
    try {
        const session = await COLLECTIONS.sessions.findOne({ uid });

        if (!session) return null;

        if (authorizedStudent.length && !authorizedStudent.includes(session.student_id)) {
            return null;
        }

        const ipHash = createHash("sha256").update(request.ip).digest("hex");

        if (
            (new Date().getTime() - session.last_access) / 1000 > 10080 * 60 ||
            (session.ip_hash && session.ip_hash !== ipHash)
        ) {
            try {
                await COLLECTIONS.sessions.deleteOne({ uid });
            } catch (error) {
                console.error(error);
            }
            return null;
        }

        await COLLECTIONS.sessions.updateOne({ uid }, { $set: { last_access: new Date().getTime(), ip_hash: ipHash } });

        const student = await COLLECTIONS.students.findOne({ id: session.student_id });

        return { is_pool: student?.matrix_is_pool };
    } catch (error) {
        console.error(error);
    }

    return null;
};

const checkAuth = async (
    request: FastifyRequest,
    response: FastifyReply,
    authorizedStudent: number[] = []
): Promise<null | Record<string, any>> => {
    try {
        const uid = request.headers?.authorization;

        if (!uid) {
            throw new Error("Invalid authorization.");
            return null;
        }

        const isValid = await isUidValid(request, uid, authorizedStudent);
        if (!isValid) {
            throw new Error("Expired authorization.");
            return null;
        }

        return isValid;
    } catch (error) {
        response.code(400);
        response.send({ error: "Session error." });
        throw error;
    }
};

export default {
    isUidValid,
    checkAuth,
};
