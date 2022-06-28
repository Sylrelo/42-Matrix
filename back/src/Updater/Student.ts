import { FastifyReply, FastifyRequest } from "fastify";
import { AnyBulkWriteOperation, Document } from "mongodb";
import { IStudent } from "../Interfaces/IStudent";
import security from "../Routes/security";
import shared, { COLLECTIONS } from "../shared";

export class Student {
    private isAlreadyUpdating: Boolean = false;
    private isAlreadyUpdatingInactive: Boolean = false;

    static updateTimeout = new Date().getTime() - 24 * 3600 * 1000;
    static lastseenTimeout = new Date().getTime() - 7 * 24 * 3600 * 1000;

    static async RouteGetAllStudents(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply);

            const query = request.query as Record<string, any>;

            const students = await COLLECTIONS.students
                .find({})
                .limit(20)
                .skip(query.page * 20)
                .toArray();
            const total = await COLLECTIONS.students.count({});

            reply.send({ students, total });
        } catch (error) {
            console.error(error);
            reply.code(500);
            reply.send(error);
        }
    }

    async UpdateActive() {
        try {
            if (this.isAlreadyUpdating) return;

            console.log("[Student] Update Active Students");

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
                delete studentData?.expertises_users;
                delete studentData?.patroning;
                delete studentData?.patroned;

                transaction.push({
                    updateOne: {
                        filter: { id: student.id },
                        update: { $set: { ...studentData, matrix_updated_at: new Date().getTime() } },
                    },
                });
            }

            if (transaction.length) await COLLECTIONS.students.bulkWrite(transaction);
        } catch (error) {
            console.error(error);
        }
    }
}
