import { FastifyReply, FastifyRequest } from "fastify";
import { AnyBulkWriteOperation, Document } from "mongodb";
import { location } from "../App";
import { IStudent } from "../Interfaces/IStudent";
import security from "../Routes/security";
import shared, { COLLECTIONS } from "../shared";
import { isPool, MONTHS_NAME } from "../utils";

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
            // await location.Update();

            const studentsId = Location.actives.map((location) => location.id);

            const suplData = (await COLLECTIONS.students
                .find({ id: { $in: studentsId } })
                .project({ groups: 1, coalition: 1, id: 1, _id: 0 })
                .toArray()) as IStudent[];

            const tmp = Location.actives.map((location) => ({
                ...location,
                groups: suplData.find((student) => student.id === location.id)?.groups,
                coalition: suplData.find((student) => student.id === location.id)?.coalition,
            }));

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

            // apiLocations.push({
            //     end_at: "",
            //     id: 9999999,
            //     begin_at: "",
            //     primary: true,
            //     host: "z3r5p2",
            //     campus_id: 9999999,
            //     user: {
            //         pool_month: "june",
            //         pool_year: "2022",
            //         id: 9999999,
            //         login: "pool test",
            //         image_url:
            //             "https://www.gannett-cdn.com/-mm-/e6db794ee53cd5604c71d33cdc4e1c2d8dd1e9f6/c=0-97-3000-1792/local/-/media/2016/05/28/Phoenix/Phoenix/636000630435534109-uscpcent02-6pxapvk0nu0vrw8pa7y-original.jpg",
            //     },
            // });
            // apiLocations.push({
            //     end_at: "",
            //     id: 99991,
            //     begin_at: "",
            //     primary: true,
            //     host: "z3r5p6",
            //     campus_id: 99991,
            //     user: {
            //         pool_month: "june",
            //         pool_year: "2022",
            //         id: 999991,
            //         login: "999994",
            //         image_url:
            //             "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
            //     },
            // });

            apiLocations = (apiLocations ?? []).filter(
                (value, index, self) => !value.user?.id || index === self.findIndex((t) => t.user.id === value.user.id)
            );

            for (const location of apiLocations) {
                studentLocations.push(this.createDatabaseStudentObject(location));
            }

            const bulkOperations: AnyBulkWriteOperation<Document>[] = [];

            Location.actives = [];

            for (const student of studentLocations) {
                bulkOperations.push({
                    updateOne: {
                        filter: { id: student.id },
                        update: { $set: { ...student, matrix_is_pool: isPool(student) } },
                        upsert: true,
                    },
                });
                Location.actives.push(student);
            }

            if (bulkOperations.length) await COLLECTIONS.students.bulkWrite(bulkOperations);
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
