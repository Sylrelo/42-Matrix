"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
class Router {
    constructor(request, response) {
        this._possibleResponses = {
            json: this._jsonResponse,
        };
        this._request = request;
        this._response = response;
    }
    _checkUrl(url) {
        return this._request.url.includes(url);
    }
    static jsonResponse(data) {
        return JSON.stringify(data);
    }
    _jsonResponse(data) {
        this._response.end(JSON.stringify(data));
    }
    handle() {
        if (this._fn == null) {
            this._response.writeHead(200);
            this._response.end("---");
        }
        this._fn({
            queries: [],
            body: null,
            jsonBody: null,
        }, this._possibleResponses);
    }
    get(url, fn) {
        var _a, _b;
        if (!this._checkUrl(url) && ((_b = (_a = this._request) === null || _a === void 0 ? void 0 : _a.method) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== "get") {
            return;
        }
        this._fn = fn;
    }
    post(url, fn) {
        var _a, _b;
        if (!this._checkUrl(url) && ((_b = (_a = this._request) === null || _a === void 0 ? void 0 : _a.method) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== "post") {
            return;
        }
        this._fn = fn;
    }
    put(url, fn) {
        var _a, _b;
        if (!this._checkUrl(url) && ((_b = (_a = this._request) === null || _a === void 0 ? void 0 : _a.method) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== "put") {
            return;
        }
        this._fn = fn;
    }
    delete(url, fn) {
        var _a, _b;
        if (!this._checkUrl(url) && ((_b = (_a = this._request) === null || _a === void 0 ? void 0 : _a.method) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== "delete") {
            return;
        }
        this._fn = fn;
    }
}
exports.Router = Router;
//# sourceMappingURL=router.js.map