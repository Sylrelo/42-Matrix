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
const axios_1 = __importDefault(require("axios"));
const App_1 = require("./App");
const shared_1 = __importDefault(require("./shared"));
const status_1 = require("./status");
const API_URL = "https://api.intra.42.fr/v2/";
class DeferredPromise {
    constructor() {
        this.done = false;
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
        });
        this._init();
    }
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.promise;
            }
            catch (error) {
                console.error(error);
            }
            finally {
                this.done = true;
            }
        });
    }
}
class FortyTwo {
    constructor() {
        this._pendingRequest = [];
        this._pendingRequestObject = {};
    }
    getTotalPendingRequest() {
        return Object.values(this._pendingRequestObject).length;
    }
    _post(url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.post(url, data);
            return response === null || response === void 0 ? void 0 : response.data;
        });
    }
    refreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._add(10, `${API_URL}oauth/token`, "POST", {}, {
                grant_type: "refresh_token",
                client_id: process.env.UID,
                client_secret: App_1.CONFIG.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URL,
                refresh_token: refreshToken,
            });
        });
    }
    authorisationPost(code) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(process.env.UID, process.env.SECRET, process.env.REDIRECT_URL);
            return yield this._add(10, `${API_URL}oauth/token`, "POST", {}, {
                grant_type: "authorization_code",
                client_id: process.env.UID,
                client_secret: App_1.CONFIG.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URL,
                code,
            });
        });
    }
    _executePendingRequest(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = this._pendingRequestObject[uri];
            if (request.response.done || request.active) {
                return;
            }
            const startTime = new Date().getTime();
            try {
                request.active = true;
                const response = yield (0, axios_1.default)(request.uri, {
                    headers: request.headers,
                    method: request.method,
                    data: request.data,
                });
                request.response.resolve(response.data);
                delete this._pendingRequestObject[uri];
            }
            catch (error) {
                request.response.reject(error);
                request.active = false;
                delete this._pendingRequestObject[uri];
            }
            finally {
                const endTime = new Date().getTime();
                status_1.Stats.Add("42Requests", endTime - startTime);
                status_1.Stats.LogRoute(uri);
            }
        });
    }
    handlePending() {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const expireIn = new Date().getTime() / 1000 - ((_a = this._tokenData) === null || _a === void 0 ? void 0 : _a.created_at);
            if (expireIn <= 12) {
                console.log("Temporarily stopping pending request, token will expire soon.");
                this.handlePending();
                return;
            }
            const pendingArray = Object.values(this._pendingRequestObject).filter((requests) => !requests.response.done);
            pendingArray.sort((a, b) => b.priority - a.priority);
            const active = pendingArray.filter((requests) => requests.active).length;
            for (let i = 0; i < +process.env.MAX_REQUEST_PER_SECONDS - active; i++) {
                if (!(pendingArray === null || pendingArray === void 0 ? void 0 : pendingArray[i])) {
                    continue;
                }
                this._executePendingRequest(pendingArray[i].uri);
            }
            this.handlePending();
        }), 1200);
    }
    _add(priority, uri, method, headers, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const current = this._pendingRequestObject[uri];
            if (current) {
                return yield current.response.promise;
            }
            this._pendingRequestObject[uri] = {
                response: new DeferredPromise(),
                uri,
                headers,
                method,
                createdAt: new Date(),
                active: false,
                data,
                priority: priority,
                retries: 0,
            };
            return yield this._pendingRequestObject[uri].response.promise;
        });
    }
    get(url, priority, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cachedResponse = yield shared_1.default.cache.get(url);
                console.log(`[${!!cachedResponse ? "HIT" : "MISS"}] ${url}`);
                if (cachedResponse) {
                    return cachedResponse;
                }
                const response = yield this._add(priority !== null && priority !== void 0 ? priority : 1, `${API_URL}${url}`, "GET", {
                    Authorization: `Bearer ${this._tokenData.access_token}`,
                    "Content-Type": "application/json",
                });
                shared_1.default.cache.set(url, response, ttl);
                return response;
            }
            catch (error) {
                console.error(error);
                return null;
            }
        });
    }
    getUser(bearerToken, url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this._add(4, `${API_URL}${url}`, "GET", {
                    Authorization: `Bearer ${bearerToken}`,
                    "Content-Type": "application/json",
                });
                return response;
            }
            catch (error) {
                console.error(error);
                return null;
            }
        });
    }
    getAllOffset(url, perPage, offset, priority, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let page = offset;
                let results = [];
                let lastResultCount = 0;
                while (true) {
                    const response = yield this.get(`${url}&per_page=${perPage}&page=${page}`, priority, ttl);
                    results = [...results, ...response];
                    lastResultCount = response === null || response === void 0 ? void 0 : response.length;
                    if ((response === null || response === void 0 ? void 0 : response.length) < perPage) {
                        if ((response === null || response === void 0 ? void 0 : response.length) === 0) {
                            page--;
                        }
                        break;
                    }
                    page++;
                }
                return {
                    data: results,
                    page,
                    lastResultCount,
                };
            }
            catch (error) {
                console.error(error);
                return null;
            }
        });
    }
    getAll(url, perPage = 30, priority, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let page = 0;
                let results = [];
                while (true) {
                    const response = yield this.get(`${url}&per_page=${perPage}&page=${page}`, priority, ttl);
                    results = [...results, ...response];
                    if ((response === null || response === void 0 ? void 0 : response.length) < perPage) {
                        break;
                    }
                    page++;
                }
                return results;
            }
            catch (error) {
                console.error(error);
                return null;
            }
        });
    }
    getToken() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const expireIn = new Date().getTime() / 1000 - ((_a = this._tokenData) === null || _a === void 0 ? void 0 : _a.created_at);
                if (7200 - expireIn < 10) {
                    console.log("Expires in", 7200 - expireIn);
                }
                if (this._tokenData && expireIn < 7200) {
                    return;
                }
                this._tokenData = yield this._post("https://api.intra.42.fr/oauth/token", {
                    grant_type: "client_credentials",
                    client_id: process.env.UID,
                    client_secret: App_1.CONFIG.CLIENT_SECRET,
                });
                console.log("Got new token", this._tokenData.access_token);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
exports.default = FortyTwo;
//# sourceMappingURL=42.js.map