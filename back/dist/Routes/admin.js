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
exports.adminRoute = void 0;
const child_process_1 = require("child_process");
const security_1 = __importDefault(require("./security"));
const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (err, stdout, stderr) => {
            if (err != null) {
                reject(stderr);
            }
            console.log({ err, stdout, stderr });
            resolve(stdout);
        });
    });
};
const adminRoute = (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Only "slopez" authorized for now
        yield security_1.default.checkAuth(request, reply, [40737]);
        //@ts-ignore
        const type = (_a = request.query) === null || _a === void 0 ? void 0 : _a.type;
        const results = [];
        if (type === "pull") {
            results.push(yield execPromise("eval $(ssh-agent) && git reset --hard origin/master && git pull"));
        }
        if (type === "back") {
            results.push(yield execPromise("yarn install && yarn run migrate && yarn build"));
            results.push(yield execPromise("pm2 restart 3"));
        }
        if (type === "front") {
            results.push(yield execPromise('cd ../front && yarn install && NODE_OPTIONS="--max-old-space-size=4096" yarn build'));
        }
        reply.send(results);
    }
    catch (error) {
        console.error(error);
    }
});
exports.adminRoute = adminRoute;
//# sourceMappingURL=admin.js.map