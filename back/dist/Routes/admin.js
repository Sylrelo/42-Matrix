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
exports.Admin = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const App_1 = require("../App");
const shared_1 = require("../shared");
const security_1 = __importDefault(require("./security"));
const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (err, stdout, stderr) => {
            if (err != null) {
                reject(stderr);
            }
            console.log({ err, stdout, stderr });
            resolve({ stdout, stderr });
        });
    });
};
class Admin {
    static GetLogs(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply, [40737]);
                const logs = yield shared_1.COLLECTIONS.logs.find({}).sort({ created_at: -1 }).limit(40).toArray();
                reply.send(logs);
            }
            catch (error) {
                console.error(error);
                reply.send({});
            }
        });
    }
    static Restart(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply, [40737]);
                const res = yield execPromise("pm2 restart 0");
                reply.send(res);
            }
            catch (error) {
                console.error(error);
                reply.send({});
            }
        });
    }
    static Pull(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply, [40737]);
                const res = yield execPromise("eval $(ssh-agent) && git reset --hard origin/master && git pull origin master && git reset --hard origin/master");
                reply.send(res);
            }
            catch (error) {
                console.error(error);
                reply.send({});
            }
        });
    }
    static ChangeSecret(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield security_1.default.checkAuth(request, reply, [40737]);
                const body = request.body;
                if (body.secret) {
                    App_1.CONFIG.CLIENT_SECRET = body.secret;
                    yield new Promise((resolve, reject) => {
                        (0, fs_1.writeFile)(".localConfig.json", JSON.stringify(body), (err) => {
                            if (err)
                                reject(err);
                            resolve(null);
                        });
                    });
                }
                reply.send({});
            }
            catch (error) {
                console.error(error);
                reply.code(400);
                reply.send(error);
            }
        });
    }
}
exports.Admin = Admin;
//# sourceMappingURL=admin.js.map