"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingRoute = void 0;
const App_1 = require("../App");
const shared_1 = require("../shared");
const security_1 = __importDefault(require("./security"));
const RankingRoute = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const student = yield security_1.default.checkAuth(request, reply);
        const query = request.query;
        const displayPool = +query.display_pool === 1 && !student.is_pool;
        let availableYears = [];
        let cursusId = 21;
        let matchFilter = {
            $or: [{ matrix_is_pool: false }, { matrix_is_pool: { $exists: false } }],
        };
        if (student.is_pool || displayPool) {
            matchFilter = { matrix_is_pool: true };
            cursusId = 9;
            availableYears = yield shared_1.COLLECTIONS.students.distinct("pool_year", { matrix_is_pool: true });
        }
        else {
            availableYears = yield shared_1.COLLECTIONS.students.distinct("pool_year", {
                $or: [{ matrix_is_pool: false }, { matrix_is_pool: { $exists: false } }],
            });
        }
        const ranking = yield shared_1.COLLECTIONS.students
            .aggregate([
            { $match: matchFilter },
            { $match: { login: { $nin: App_1.TEST_ACCOUNT } } },
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
    }
    catch (error) {
        console.error(error);
        reply.code(500);
        reply.send(error);
    }
});
exports.RankingRoute = RankingRoute;
//# sourceMappingURL=ranking.js.map