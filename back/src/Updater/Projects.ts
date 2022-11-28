import { FastifyReply, FastifyRequest } from "fastify";
import { AnyBulkWriteOperation } from "mongodb";
import security from "../Routes/security";
import shared, { COLLECTIONS } from "../shared";

export class Project {
    static async GetProjectDetail(request: FastifyRequest, reply: FastifyReply) {
        try {
            const student = await security.checkAuth(request, reply);

            if (student.is_pool) {
                reply.code(402);
                reply.send({});
                return;
            }

            const params = request.params as { id: number };

            const project = await COLLECTIONS.projects.findOne({ id: +params.id });

            const students = await COLLECTIONS.students
                .aggregate([
                    {
                        $match: { "projects_users.project.id": +params.id },
                    },
                    {
                        $project: {
                            login: 1,
                            image_url: 1,
                            image: 1,
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
        } catch (error) {
            console.error(error);
            reply.code(500);
            reply.send(error);
        }
    }

    static async GetProjects(request: FastifyRequest, reply: FastifyReply) {
        try {
            const student = await security.checkAuth(request, reply);

            if (student.is_pool) {
                reply.code(402);
                reply.send({});
                return;
            }

            const projects = await COLLECTIONS.projects
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

            const studentProjects = await COLLECTIONS.students
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
        } catch (error) {
            console.error(error);
            reply.code(500);
            reply.send(error);
        }
    }

    static async Update() {
        try {
            const lastUpdate = await COLLECTIONS.projects.findOne({ type: "matrix_update" });

            const projects = await shared.api.getAllOffset<any[]>(
                "cursus/21/projects?sort=-created_at",
                50,
                lastUpdate?.matrix_last_page ?? 1,
                1
            );

            const bulkOperations: AnyBulkWriteOperation[] = [];
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
            if (bulkOperations.length) await COLLECTIONS.projects.bulkWrite(bulkOperations);

            await COLLECTIONS.projects.updateOne(
                { type: "matrix_update" },
                {
                    $set: {
                        matrix_last_page: projects.page,
                    },
                },
                { upsert: true }
            );
        } catch (error) {
            console.error(error);
        }
    }
}
