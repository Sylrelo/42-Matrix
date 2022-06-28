import { AnyBulkWriteOperation, Document } from "mongodb";
import { IStudent } from "../Interfaces/IStudent";
import shared, { COLLECTIONS } from "../shared";

export class Student {
    private isAlreadyUpdating: Boolean = false;
    private isAlreadyUpdatingInactive: Boolean = false;

    static updateTimeout = new Date().getTime() - 24 * 3600 * 1000;
    static lastseenTimeout = new Date().getTime() - 7 * 24 * 3600 * 1000;

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
                .limit(15)
                .toArray()) as IStudent[];

            if (students.length) {
                await this.updateDatabase(students);
            }
        } catch (error) {
            console.error(error);
        } finally {
            this.isAlreadyUpdatingInactive = false;
        }
    }

    async UpdateWithCoalition() {
        try {
            const coalitions = await COLLECTIONS.coalitions
                .find({})
                .sort({ matrix_created_at: -1, id: 1 })
                .project({ _id: 0, id: 1, color: 1 })
                .limit(3)
                .toArray();

            for (const coalition of coalitions) {
                const students = await shared.api.getAll<any[]>(`/coalitions/${coalition.id}/users?`, 100);

                const bulkOperations: AnyBulkWriteOperation<Document>[] = [];

                for (const student of students) {
                    bulkOperations.push({
                        updateOne: {
                            filter: { id: student.id },
                            update: { $set: { ...student, coalition: coalition } },
                            upsert: true,
                        },
                    });
                }

                if (bulkOperations.length) await COLLECTIONS.students.bulkWrite(bulkOperations);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async GetAllStudents() {
        try {
            console.log("Student.GetAllStudents");

            const students = await shared.api.getAll<IStudent[]>("cursus/21/users?filter[campus_id]=9", 100, 1, 30);

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
