import { FastifyReply, FastifyRequest } from "fastify";
import { AnyBulkWriteOperation, Document } from "mongodb";
import { IStudent } from "../Interfaces/IStudent";
import security from "../Routes/security";
import shared, { COLLECTIONS } from "../shared";
import { isPool } from "../utils";

class Route {
    static baseProject: any[] = [
        {
            $match: {
                $and: [
                    {
                        pool_year: { $ne: null },
                    },
                    {
                        pool_year: { $gte: "2017" },
                    },
                ],
            },
        },
        {
            $project: {
                cursus_users: {
                    $filter: {
                        input: "$cursus_users",
                        as: "cursus",
                        cond: {
                            $eq: ["$$cursus.cursus_id", 21],
                        },
                    },
                },
                pool_year: 1,
            },
        },
    ];

    static async GetNumberOfStudentsPerPromo() {
        try {
            const students = await COLLECTIONS.students
                .aggregate([
                    ...this.baseProject,
                    {
                        $group: {
                            _id: "$pool_year",
                            count: { $sum: 1 },
                        },
                    },
                ])
                .toArray();

            return students;
        } catch (error) {
            console.error(error);
        }
    }

    static async GetNumberOfBlackholedStudentsPerPromo() {
        try {
            const students = await COLLECTIONS.students
                .aggregate([
                    ...this.baseProject,
                    {
                        $match: {
                            $and: [
                                { "cursus_users.blackholed_at": { $exists: true } },
                                {
                                    "cursus_users.blackholed_at": {
                                        $lt: new Date(),
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $group: {
                            _id: "$pool_year",
                            count: { $sum: 1 },
                        },
                    },
                ])
                .toArray();

            return students;
        } catch (error) {
            console.error(error);
        }
    }

    static async GetBlackholedStatsPerPromo() {
        try {
            const students = await Route.GetNumberOfStudentsPerPromo();
            const blackholed = await Route.GetNumberOfBlackholedStudentsPerPromo();
            const perPromo = {};

            for (const student of students) {
                const bh = blackholed.find((bh) => bh._id === student._id);
                perPromo[student._id] = {
                    total: student.count,
                    blackholed: bh?.count ?? 0,
                    percentage: +(((bh?.count ?? 0) / student.count) * 100).toPrecision(3),
                };
            }

            return perPromo;
        } catch (error) {
            console.error(error);
        }
    }
}
export class Student {
    private isAlreadyUpdating: Boolean = false;
    private isAlreadyUpdatingInactive: Boolean = false;

    static updateTimeout = new Date().getTime() - 24 * 3600 * 1000;
    static lastseenTimeout = new Date().getTime() - 7 * 24 * 3600 * 1000;

    static async RouteGetAllStudents(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply);
            const query = request.query as Record<string, any>;

            const time_start = new Date().getTime();

            const skills = await shared.api.getAll<any[]>(`cursus/21/skills?`, 30, 1, 160);

            const perPromoStats = await Route.GetBlackholedStatsPerPromo();

            let pipeline = [];

            if (query.skill_id && query.skill_level) {
                pipeline.push({
                    $match: {
                        "cursus_users.skills": {
                            $elemMatch: {
                                id: +query.skill_id,
                                level: { $gte: +query.skill_level },
                            },
                        },
                    },
                });
            }

            const basePipeline = [
                {
                    $match: {
                        login: { $not: /3b3-/ },
                    },
                },
                {
                    $project: {
                        cursus_users: {
                            $filter: {
                                input: "$cursus_users",
                                as: "cursus",
                                cond: {
                                    $eq: ["$$cursus.cursus_id", 21],
                                },
                            },
                        },
                        login: 1,
                        id: 1,
                        image_url: 1,
                        wallet: 1,
                        correction_point: 1,
                        first_name: 1,
                        last_name: 1,
                        matrix_updated_at: 1,
                        last_seen: 1,
                        // projects_users: 1,
                        pool_year: 1,
                        pool_month: 1,
                    },
                },
                ...pipeline,
            ];

            let sort: any = {
                $sort: {
                    // login: 1,
                },
            };

            if (query.login_sort) sort["$sort"].login = +query.login_sort;
            if (query.wallet_sort) sort["$sort"].wallet = +query.wallet_sort;
            if (query.point_sort) sort["$sort"].correction_point = +query.point_sort;
            if (query.level_sort) sort["$sort"]["cursus_users.level"] = +query.level_sort;
            if (query.bh_sort) sort["$sort"]["cursus_users.blackholed_at"] = +query.bh_sort;

            const students = await COLLECTIONS.students
                .aggregate([
                    ...basePipeline,
                    { ...sort },
                    // {
                    //     $sort: {
                    //         login: 1,
                    //         // "cursus_users.level": -1,
                    //     },
                    // },
                    {
                        $skip: query.page * 20,
                    },
                    {
                        $limit: 20,
                    },
                ])
                .toArray();

            const total = await COLLECTIONS.students
                .aggregate([...basePipeline, { $group: { _id: null, total: { $sum: 1 } } }])
                .toArray();

            reply.send({
                students,
                total: total[0].total,
                skills,
                time: new Date().getTime() - time_start,
                perPromoStats,
            });
        } catch (error) {
            console.error(error);
            reply.code(500);
            reply.send(error);
        }
    }

    async UpdateActive() {
        try {
            console.log("[Student] Update Active Students", this.isAlreadyUpdating);

            if (this.isAlreadyUpdating) return;

            this.isAlreadyUpdating = true;

            const students = (await COLLECTIONS.students
                .find({
                    $and: [
                        { last_seen: { $gt: Student.lastseenTimeout } },
                        { matrix_updated_at: { $lt: Student.updateTimeout } },
                    ],
                })
                .project({ id: 1 })
                .toArray()) as IStudent[];

            if (students.length) {
                await this.updateDatabase(students);
            }
        } catch (error) {
            console.error(error);
        } finally {
            this.isAlreadyUpdating = false;
        }
    }

    async UpdateInactive() {
        try {
            if (this.isAlreadyUpdatingInactive) return;
            console.log("[Student] Update Inactive Students");

            this.isAlreadyUpdatingInactive = true;

            const students = (await COLLECTIONS.students
                .find({
                    $or: [
                        { matrix_updated_at: 0 },
                        { matrix_updated_at: null },
                        { matrix_updated_at: { $exists: false } },
                    ],
                })
                .project({ id: 1 })
                .limit(50)
                .toArray()) as IStudent[];

            if (students.length) await this.updateDatabase(students);

            console.log("Student.UpdateInactive : Done.");
        } catch (error) {
            console.error(error);
        } finally {
            this.isAlreadyUpdatingInactive = false;
        }
    }

    async UpdateWithCoalition() {
        try {
            console.log("Student.UpdateWitHCoaltion : Started.");
            const coalitions = await COLLECTIONS.coalitions
                .find({})
                .sort({ matrix_created_at: -1, id: 1 })
                .project({ _id: 0, id: 1, color: 1, cursus_id: 1 })
                .limit(6)
                .toArray();

            for (const coalition of coalitions) {
                const students = await shared.api.getAll<any[]>(`/coalitions/${coalition.id}/users?`, 100);

                const bulkOperations: AnyBulkWriteOperation<Document>[] = [];

                for (const student of students) {
                    let filter = {};

                    if (coalition.cursus_id === 21) {
                        filter = { $or: [{ matrix_is_pool: false }, { matrix_is_pool: { $exists: false } }] };
                    } else if (coalition.cursus_id === 9) {
                        filter = { matrix_is_pool: true };
                    }

                    bulkOperations.push({
                        updateOne: {
                            filter: {
                                id: student.id,
                                ...filter,
                            },
                            update: { $set: { ...student, coalition: coalition } },
                        },
                    });
                }

                if (bulkOperations.length) await COLLECTIONS.students.bulkWrite(bulkOperations);
                console.log("Student.UpdateWitHCoaltion : Done.");
            }
        } catch (error) {
            console.error(error);
        }
    }

    async GetAllStudents() {
        try {
            console.log("Student.GetAllStudents");

            const students = await shared.api.getAll<IStudent[]>(
                "achievements/218/users?filter[primary_campus_id]=9",
                100,
                1,
                30
            );

            console.log(`Student's count : `, students.length);

            const transaction: AnyBulkWriteOperation<Document>[] = [];

            for (const student of students) {
                transaction.push({
                    updateOne: {
                        filter: { id: student.id },
                        update: { $set: { ...student } },
                        upsert: true,
                    },
                });
            }

            if (transaction.length) await COLLECTIONS.students.bulkWrite(transaction);
        } catch (error) {
            console.error(error);
        }
    }

    private async updateDatabase(students: any[]) {
        try {
            const transaction: AnyBulkWriteOperation<Document>[] = [];

            console.log(students.length, "to update.");

            for (const student of students) {
                const studentData = (await shared.api.get<any>("users/" + student.id)) as IStudent;

                delete studentData?.campus;
                delete studentData?.languages_users;
                delete studentData?.patroning;
                delete studentData?.patroned;
                delete studentData?.phone;
                delete studentData?.usual_first_name;
                delete studentData?.usual_full_name;
                delete studentData?.partnerships;
                delete studentData?.email;
                delete studentData?.expertises_users;

                transaction.push({
                    updateOne: {
                        filter: { id: student.id },
                        update: {
                            $set: {
                                ...studentData,
                                matrix_updated_at: new Date().getTime(),
                                matrix_is_pool: isPool(studentData),
                            },
                        },
                    },
                });
            }

            if (transaction.length) await COLLECTIONS.students.bulkWrite(transaction);
        } catch (error) {
            console.error(error);
        }
    }
}
