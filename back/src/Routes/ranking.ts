import { FastifyReply, FastifyRequest } from "fastify";
import { TEST_ACCOUNT } from "../App";
import { IStudent } from "../Interfaces/IStudent";
import { COLLECTIONS } from "../shared";
import security from "./security";

interface RankingQuery {
    pool_year?: number;
    data?: string;
}

export const RankingRoute = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const student = await security.checkAuth(request, reply);

        const query: Record<string, any> = request.query;
        const displayPool = +query.display_pool === 1 && !student.is_pool;

        let availableYears = [];

        let cursusId = 21;

        let matchFilter: Record<string, any> = {
            $or: [{ matrix_is_pool: false }, { matrix_is_pool: { $exists: false } }],
        };

        if (student.is_pool || displayPool) {
            matchFilter = { matrix_is_pool: true };
            cursusId = 9;
            availableYears = await COLLECTIONS.students.distinct("pool_year", { matrix_is_pool: true });
        } else {
            availableYears = await COLLECTIONS.students.distinct("pool_year", {
                $or: [{ matrix_is_pool: false }, { matrix_is_pool: { $exists: false } }],
            });
        }

        const ranking: IStudent[] = await COLLECTIONS.students
            .aggregate([
                { $match: matchFilter },
                { $match: { login: { $nin: TEST_ACCOUNT } } },
                {
                    $project: {
                        _id: 0,
                        id: 1,
                        login: 1,
                        wallet: 1,
                        correction_point: 1,
                        image_url: 1,
                        pool_year: 1,
                        last_seen: 1,
                        cursus_users: {
                            $filter: {
                                input: "$cursus_users",
                                as: "cursus",
                                cond: { $eq: ["$$cursus.cursus_id", cursusId] },
                            },
                        },
                    },
                },
                {
                    $project: {
                        id: 1,
                        login: 1,
                        wallet: 1,
                        correction_point: 1,
                        pool_year: 1,
                        last_seen: 1,
                        image_url: 1,
                        "cursus_users.level": 1,
                        "cursus_users.blackholed_at": 1,
                    },
                },
            ])
            .toArray();

        reply.send({ availableYears, ranking });
    } catch (error) {
        console.error(error);
        reply.code(500);
        reply.send(error);
    }
};
