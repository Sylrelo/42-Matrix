"use strict";
// import { exec } from "child_process";
// import { FastifyReply, FastifyRequest } from "fastify";
// import security from "./security";
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
const fs_1 = require("fs");
const App_1 = require("../App");
const security_1 = __importDefault(require("./security"));
// const execPromise = (command: string) => {
//     return new Promise((resolve, reject) => {
//         exec(command, (err, stdout, stderr) => {
//             if (err != null) {
//                 reject(stderr);
//             }
//             console.log({ err, stdout, stderr });
//             resolve(stdout);
//         });
//     });
// };
// export const adminRoute = async (request: FastifyRequest, reply: FastifyReply) => {
//     try {
//         // Only "slopez" authorized for now
//         await security.checkAuth(request, reply, [40737]);
//         //@ts-ignore
//         const type = request.query?.type;
//         const results = [];
//         if (type === "pull") {
//             results.push(await execPromise("eval $(ssh-agent) && git reset --hard origin/master && git pull"));
//         }
//         if (type === "back") {
//             results.push(await execPromise("yarn install && yarn run migrate && yarn build"));
//             results.push(await execPromise("pm2 restart 3"));
//         }
//         if (type === "front") {
//             results.push(
//                 await execPromise('cd ../front && yarn install && NODE_OPTIONS="--max-old-space-size=4096" yarn build')
//             );
//         }
//         reply.send(results);
//     } catch (error) {
//         console.error(error);
//     }
// };
class Admin {
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