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
const shared_1 = __importDefault(require("../../shared"));
const updateLevel = (cursusData) => __awaiter(void 0, void 0, void 0, function* () {
    yield shared_1.default.database.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
        for (const studentId in cursusData) {
            for (const cursus of cursusData[studentId]) {
                try {
                    const exists = yield shared_1.default
                        .database("Cursus_level")
                        .transacting(trx)
                        .select("*")
                        .where("student_id", studentId)
                        .andWhere("cursus_id", cursus.cursus_id);
                    if (exists.length) {
                        yield shared_1.default
                            .database("Cursus_level")
                            .transacting(trx)
                            .update({
                            cursus_id: cursus.cursus_id,
                            level: cursus.level,
                            blackholed_at: (cursus === null || cursus === void 0 ? void 0 : cursus.blackholed_at) && cursus.grade !== "Member"
                                ? new Date(cursus === null || cursus === void 0 ? void 0 : cursus.blackholed_at)
                                : null,
                        })
                            .where("student_id", studentId)
                            .andWhere("cursus_id", cursus.cursus_id);
                    }
                    else {
                        yield shared_1.default
                            .database("Cursus_level")
                            .transacting(trx)
                            .insert({
                            student_id: cursus.user.id,
                            cursus_id: cursus.cursus_id,
                            level: cursus.level,
                            blackholed_at: (cursus === null || cursus === void 0 ? void 0 : cursus.blackholed_at) && cursus.grade !== "Member"
                                ? new Date(cursus === null || cursus === void 0 ? void 0 : cursus.blackholed_at)
                                : null,
                        });
                    }
                    yield shared_1.default
                        .database("Students")
                        .transacting(trx)
                        .update({ updated_at: new Date().getTime() })
                        .where("id", studentId);
                    trx.commit;
                }
                catch (error) {
                    trx.rollback;
                    console.error(error);
                }
            }
        }
    }));
});
exports.default = updateLevel;
//# sourceMappingURL=cursus_level.js.map