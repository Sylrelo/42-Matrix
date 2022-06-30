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
const checkUpdate = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const needUpdating = yield shared_1.default
            .database("Students")
            .leftJoin("update", "linked_type_id", "=", "Students.id")
            .where(function () {
            this.where("update.type", "STUDENT_CORRECTION_CLUSTER").orWhereNull("update.type");
        })
            .andWhere(function () {
            this.whereNull("update._id").orWhere("update.updated_at", "<", new Date().getTime() - 24 * 3600 * 1000);
        })
            .orderByRaw("RANDOM()")
            .limit(1);
        for (const update of needUpdating) {
            const url = `users/${update.id}/scale_teams/as_corrected?sort=created_at`;
            const scaleTeams = yield shared_1.default.api.getAllOffset(url, 100, (_a = update === null || update === void 0 ? void 0 : update.last_page) !== null && _a !== void 0 ? _a : 0);
            update.dataUpdate = {
                last_page: scaleTeams.page,
                updated_at: new Date().getTime(),
                last_id: scaleTeams.lastResultCount,
            };
            update.dataCorrectionClusters = [];
            for (const scaleTeam of scaleTeams.data) {
                update.dataCorrectionClusters.push({
                    id: scaleTeam === null || scaleTeam === void 0 ? void 0 : scaleTeam.id,
                    corrected: update.id,
                    corrector: (_b = scaleTeam === null || scaleTeam === void 0 ? void 0 : scaleTeam.corrector) === null || _b === void 0 ? void 0 : _b.id,
                    created_at: new Date(scaleTeam.created_at).getTime(),
                    final_mark: scaleTeam.final_mark,
                    flag_id: (_c = scaleTeam === null || scaleTeam === void 0 ? void 0 : scaleTeam.flag) === null || _c === void 0 ? void 0 : _c.id,
                    project_id: (_d = scaleTeam === null || scaleTeam === void 0 ? void 0 : scaleTeam.team) === null || _d === void 0 ? void 0 : _d.project_id,
                });
            }
        }
        yield shared_1.default.database.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            for (const update of needUpdating) {
                console.log(update.login, update.updated_at);
                try {
                    for (const correction of update.dataCorrectionClusters) {
                        try {
                            yield shared_1.default.database("correction_cluster").transacting(trx).insert(correction);
                            trx.commit;
                        }
                        catch (error) {
                            // console.info(error);
                            trx.rollback;
                        }
                    }
                    if (update._id) {
                        yield shared_1.default
                            .database("update")
                            .transacting(trx)
                            .update(update.dataUpdate)
                            .where("_id", update._id);
                    }
                    else {
                        yield shared_1.default
                            .database("update")
                            .transacting(trx)
                            .insert(Object.assign(Object.assign({}, update.dataUpdate), { type: "STUDENT_CORRECTION_CLUSTER", linked_type_id: update.id }));
                    }
                    trx.commit;
                }
                catch (error) {
                    trx.rollback;
                    console.error(error);
                }
            }
        }));
    }
    catch (error) {
        console.error(error);
    }
});
exports.default = { checkUpdate };
// export default updateCorrectionCluster;
//# sourceMappingURL=correctionCluster.js.map