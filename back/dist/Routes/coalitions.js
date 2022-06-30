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
exports.getCoalitionsRoute = void 0;
const shared_1 = __importDefault(require("../shared"));
const security_1 = __importDefault(require("./security"));
const getCoalitionsRoute = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield security_1.default.checkAuth(request, reply);
    //@ts-ignore
    let limit = (_b = (_a = request.query) === null || _a === void 0 ? void 0 : _a.limit) !== null && _b !== void 0 ? _b : 1;
    limit = Math.min(24, limit);
    if (limit <= 0) {
        limit = 1;
    }
    const coalitions = yield shared_1.default
        .database("coalitions")
        .where("campus_id", 9)
        .andWhere("cursus_id", 21)
        .orderBy("date")
        .orderBy("coalition_id")
        .limit(limit * 3);
    reply.code(200);
    reply.send(coalitions);
});
exports.getCoalitionsRoute = getCoalitionsRoute;
//# sourceMappingURL=coalitions.js.map