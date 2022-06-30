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
exports.loggedStudentRoute = exports.updateLyonLocations = void 0;
const shared_1 = __importDefault(require("../shared"));
const status_1 = require("../status");
const security_1 = __importDefault(require("./security"));
const updateLyonLocations = () => __awaiter(void 0, void 0, void 0, function* () {
    const students = [];
    let result = yield shared_1.default.api.getAll("campus/9/locations?filter[active]=true&filter[primary]=true", 100, 5, 30);
    result = (result !== null && result !== void 0 ? result : []).filter((value, index, self) => { var _a; return !((_a = value.user) === null || _a === void 0 ? void 0 : _a.id) || index === self.findIndex((t) => t.user.id === value.user.id); });
    const countPerPromo = {};
    const actives = result.map((location) => {
        var _a, _b, _c, _d, _e, _f;
        try {
            students.push({
                id: location.user.id,
                login: location.user.login,
                image_url: location.user.image_url,
                new_image_url: location.user.new_image_url,
                display_name: location.user.displayname,
                last_seen: new Date().getTime(),
                correction_points: (_a = location.user.correction_point) !== null && _a !== void 0 ? _a : 0,
                level: 0,
                wallets: (_b = location.user.wallet) !== null && _b !== void 0 ? _b : 0,
                pool_year: (_c = location.user.pool_year) !== null && _c !== void 0 ? _c : 0,
                campus_id: 9,
            });
        }
        catch (error) {
            console.error(error);
        }
        if (!countPerPromo[(_d = location.user.pool_year) !== null && _d !== void 0 ? _d : 0]) {
            countPerPromo[(_e = location.user.pool_year) !== null && _e !== void 0 ? _e : 0] = 0;
        }
        countPerPromo[(_f = location.user.pool_year) !== null && _f !== void 0 ? _f : 0]++;
        return {
            host: location.host,
            login: location.user.login,
            id: location.user.id,
            image_url: location.user.image_url,
            new_image_url: location.user.new_image_url,
            displayname: location.user.displayname,
        };
    });
    for (const promo in countPerPromo) {
        (0, status_1.logConnected)(+promo, countPerPromo[promo]);
    }
    yield shared_1.default.database.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
        for (const student of students) {
            try {
                yield shared_1.default.database("Students").transacting(trx).insert(student).onConflict("id").merge(student);
                trx.commit;
            }
            catch (error) {
                trx.rollback;
            }
        }
    }));
    shared_1.default.cache.set("LYON_LOCATIONS", actives, 30);
    return actives;
});
exports.updateLyonLocations = updateLyonLocations;
const locationHandler = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    yield security_1.default.checkAuth(request, response);
    let actives = yield shared_1.default.cache.get("LYON_LOCATIONS");
    if (!actives) {
        actives = yield (0, exports.updateLyonLocations)();
    }
    response.code(200);
    response.send(actives);
});
exports.default = locationHandler;
const loggedStudentRoute = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    let response = {};
    try {
        response = shared_1.default.loggedStudent;
    }
    catch (error) {
        console.error(error);
    }
    finally {
        reply.send(response);
    }
});
exports.loggedStudentRoute = loggedStudentRoute;
//# sourceMappingURL=locations.js.map