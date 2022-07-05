// import { exec } from "child_process";
// import { FastifyReply, FastifyRequest } from "fastify";
// import security from "./security";

import { exec } from "child_process";
import { FastifyReply, FastifyRequest } from "fastify";
import { writeFile } from "fs";
import { CONFIG } from "../App";
import { COLLECTIONS } from "../shared";
import security from "./security";

const execPromise = (command: string) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err != null) {
                reject(stderr);
            }
            console.log({ err, stdout, stderr });
            resolve({ stdout, stderr });
        });
    });
};

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

export class Admin {
    static async GetLogs(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply, [40737]);

            const logs = await COLLECTIONS.logs.find({}).sort({ created_at: -1 }).limit(40).toArray();
            reply.send(logs);
        } catch (error) {
            console.error(error);
            reply.send({});
        }
    }

    static async Restart(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply, [40737]);

            const res = await execPromise("pm2 restart 0");

            reply.send(res);
        } catch (error) {
            console.error(error);
            reply.send({});
        }
    }

    static async Pull(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply, [40737]);

            const res = await execPromise(
                "eval $(ssh-agent) && git reset --hard origin/master && git pull origin master && git reset --hard origin/master"
            );

            reply.send(res);
        } catch (error) {
            console.error(error);
            reply.send({});
        }
    }

    static async ChangeSecret(request: FastifyRequest, reply: FastifyReply) {
        try {
            await security.checkAuth(request, reply, [40737]);

            const body: Record<string, any> = request.body;

            if (body.secret) {
                CONFIG.CLIENT_SECRET = body.secret;

                await new Promise((resolve, reject) => {
                    writeFile(".localConfig.json", JSON.stringify(body), (err) => {
                        if (err) reject(err);
                        resolve(null);
                    });
                });
            }

            reply.send({});
        } catch (error) {
            console.error(error);
            reply.code(400);
            reply.send(error);
        }
    }
}
