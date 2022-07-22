import { FastifyReply, FastifyRequest } from "fastify";
import { AnyBulkWriteOperation, MongoCursorInUseError } from "mongodb";
import { IStudent } from "../Interfaces/IStudent";
import security from "../Routes/security";
import shared, { COLLECTIONS } from "../shared";
import { isPool } from "../utils";
import { student as Student } from "../App";

export interface ILocation42 {
    end_at: null | string;
    id: number;
    begin_at: string;
    primary: boolean;
    host: string;
    campus_id: number;
    user: IStudent;
}

export class Location {
    static actives: IStudent[] = [];

    constructor() {
        Location.actives = [];
    }

    async Route(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply);
            const studentsId = Location.actives.map((location) => location.id);

            const suplData = (await COLLECTIONS.students
                .find({ id: { $in: studentsId } })
                .project({ groups: 1, coalition: 1, id: 1, matrix_is_pool: 1, cursus_users: 1, _id: 0 })
                .toArray()) as IStudent[];

            const tmp = Location.actives.map((location) => {
                const data = suplData.find((student) => student.id === location.id);
                const grade = data?.cursus_users?.find((cursus) => cursus.cursus_id === 21)?.grade;

                //@ts-ignore
                console.log(data?.matrix_is_pool ? null : grade);
                return {
                    ...location,
                    groups: data?.groups,
                    coalition: data?.coalition,
                    //@ts-ignore
                    is_pool: data?.matrix_is_pool,
                    //@ts-ignore
                    is_precc: data?.matrix_is_pool ? null : grade !== "Member",
                };
            });

            reply.code(200);
            reply.send(tmp);
        } catch (error) {
            console.error(error);
            reply.code(500);
            reply.send([]);
        }
    }

    async Update() {
        try {
            const studentLocations: IStudent[] = [];

            let apiLocations = await shared.api.getAll<ILocation42[]>(
                "campus/9/locations?filter[active]=true&filter[primary]=true",
                100,
                5,
                30
            );

            apiLocations = (apiLocations ?? []).filter(
                (value, index, self) => !value.user?.id || index === self.findIndex((t) => t.user.id === value.user.id)
            );

            for (const location of apiLocations) {
                studentLocations.push(this.createDatabaseStudentObject(location));
            }

            const bulkOperations: AnyBulkWriteOperation[] = [];

            Location.actives = [];

            for (const student of studentLocations) {
                let updater = {};

                if (isPool(student)) {
                    updater = { matrix_is_pool: true };
                }

                bulkOperations.push({
                    updateOne: {
                        filter: { id: student.id },
                        update: { $set: { ...student, ...updater } },
                        upsert: true,
                    },
                });
                Location.actives.push(student);
            }

            if (bulkOperations.length) await COLLECTIONS.students.bulkWrite(bulkOperations);

            for (const student of studentLocations) {
                Student.UpdateOneStudent(student.id);
            }
        } catch (error) {
            console.error(error);
        }
    }

    private createDatabaseStudentObject(location: ILocation42): IStudent {
        return {
            id: location.user.id,
            login: location.user.login,
            image_url: location.user.image_url,
            new_image_url: location.user.new_image_url,
            display_name: location.user.displayname,
            correction_point: location.user.correction_point ?? 0,
            wallet: location.user.wallet ?? 0,
            pool_year: location.user.pool_year,
            pool_month: location.user.pool_month,
            last_seen: new Date().getTime(),
            location: location.host,
        };
    }
}
