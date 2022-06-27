import { FastifyReply, FastifyRequest } from "fastify";
import { AnyBulkWriteOperation, Document } from "mongodb";
import security from "../Routes/security";
import shared, { COLLECTIONS } from "../shared";

interface ICoalition {
    id: number;
    name: string;
    slug: string;
    image_url: string;
    cover_url: string;
    color: string;
    score: number;
    user_id: number;
}

interface IBloc {
    id: number;
    campus_id: number;
    cursus_id: number;
    squad_size: number;
    created_at: string;
    updated_at: string;
    coalitions: ICoalition[];
}

export class Coalition {
    async Route(request: FastifyRequest, reply: FastifyReply) {
        try {
            const student = await security.checkAuth(request, reply);

            const coalitions = await COLLECTIONS.coalitions
                .find({ cursus_id: student.is_pool ? 9 : 21 })
                .sort({ matrix_created_at: -1, id: 1 })
                .project({ _id: 0, score: 1, name: 1, color: 1 })
                .limit(3)
                .toArray();

            reply.code(200);
            reply.send(coalitions);
        } catch (error) {
            console.error(error);
            reply.code(500);
            reply.send(error);
        }
    }

    async Update(cursus_id: number) {
        try {
            console.log("Updating Coalitions for cursus", cursus_id);

            const bloc = await shared.api.get<IBloc[]>(
                `blocs?filter[campus_id]=9&filter[cursus_id]=${cursus_id}&sort=id`
            );

            const bulkOperations: AnyBulkWriteOperation<Document>[] = [];

            for (const coalition of bloc?.[0].coalitions ?? []) {
                delete coalition.user_id;
                delete coalition.slug;
                delete coalition.image_url;
                delete coalition.cover_url;

                bulkOperations.push({
                    insertOne: { document: { ...coalition, matrix_created_at: new Date(), cursus_id } },
                });
            }

            if (bulkOperations.length) await COLLECTIONS.coalitions.bulkWrite(bulkOperations);
        } catch (error) {
            console.error(error);
        }
    }
}
