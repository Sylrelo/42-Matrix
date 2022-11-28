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
exports.LastActionsRoute = void 0;
const shared_1 = require("../shared");
const security_1 = __importDefault(require("./security"));
class LastActionsRoute {
    static Get(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply);
                const lastProjects = yield shared_1.COLLECTIONS.students
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
            }
            catch (error) {
                console.error(error);
                reply.send(error);
            }
        });
    }
}
exports.LastActionsRoute = LastActionsRoute;
//# sourceMappingURL=lastActions.js.map