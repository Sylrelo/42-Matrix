"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Coalition = void 0;
const security_1 = __importDefault(require("../Routes/security"));
const shared_1 = __importStar(require("../shared"));
class Coalition {
    Route(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield security_1.default.checkAuth(request, reply);
                const coalitions = yield shared_1.COLLECTIONS.coalitions
                    .find({ cursus_id: student.is_pool ? 9 : 21 })
                    .sort({ matrix_created_at: -1, id: 1 })
                    .project({ _id: 0, score: 1, name: 1, color: 1 })
                    .limit(4)
                    .toArray();
                reply.code(200);
                reply.send(coalitions);
            }
            catch (error) {
                console.error(error);
                reply.code(500);
                reply.send(error);
            }
        });
    }
    Update(cursus_id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Updating Coalitions for cursus", cursus_id);
                const bloc = yield shared_1.default.api.get(`blocs?filter[campus_id]=9&filter[cursus_id]=${cursus_id}&sort=id`);
                const bulkOperations = [];
                for (const coalition of (_a = bloc === null || bloc === void 0 ? void 0 : bloc[0].coalitions) !== null && _a !== void 0 ? _a : []) {
                    delete coalition.user_id;
                    delete coalition.slug;
                    delete coalition.image_url;
                    delete coalition.cover_url;
                    bulkOperations.push({
                        insertOne: { document: Object.assign(Object.assign({}, coalition), { matrix_created_at: new Date(), cursus_id }) },
                    });
                }
                if (bulkOperations.length)
                    yield shared_1.COLLECTIONS.coalitions.bulkWrite(bulkOperations);
                console.log("Coalition.Update : Done.");
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
exports.Coalition = Coalition;
//# sourceMappingURL=Coalitions.js.map