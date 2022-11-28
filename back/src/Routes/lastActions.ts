import { FastifyReply, FastifyRequest } from "fastify";
import { COLLECTIONS } from "../shared";
import security from "./security";

export class LastActionsRoute {
    static async Get(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply);

            const lastProjects = await COLLECTIONS.students
                .aggregate([
                    {
                        $project: {
                            projects_users: 1,
                            login: 1,
                        },
                    },
                    {
                        $unwind: {
                            path: "$projects_users",
                            preserveNullAndEmptyArrays: false,
                        },
                    },
                    {
                        $sort: {
                            "projects_users.marked_at": -1,
                        },
                    },
                    {
                        $limit: 40,
                    },
                ])
                .toArray();

            reply.send(lastProjects);
        } catch (error) {
            console.error(error);
            reply.send(error);
        }
    }
}
