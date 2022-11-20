import NodeCache from "node-cache";
import FortyTwo from "./42";
import { Collection, MongoClient } from "mongodb";
import { exit } from "process";

if (!process.env?.MONGO_USER || !process.env?.MONGO_HOST || !process.env?.MONGO_PASSWORD) {
    console.log("Wrong environment variables.");
    exit(1);
}

const uri = `mongodb://${process.env?.MONGO_USER}:${process.env?.MONGO_PASSWORD}@${process.env?.MONGO_HOST}:27017?directConnection=true`;

const client = new MongoClient(uri);

interface StatsApi {
    responseTime?: number;
    count?: number;
}

interface Status {
    remoteApi: StatsApi;
    matrixApi: StatsApi;
    startTime: Date;
}

const remoteApi: { [index: string]: StatsApi } = {};
const matrixApi: { [index: string]: StatsApi } = {};

const status: Status = {
    remoteApi,
    matrixApi,
    startTime: new Date(),
};

type LoggedStudent = {
    min: number;
    max: number;
    totalForAvg: number;
    countForAvg: number;
};

type Shared = {
    api?: FortyTwo;
    cache?: NodeCache;
    status: Status;
    loggedStudent: Record<string, Record<number, LoggedStudent>>;
    mongo: MongoClient;
};

const shared: Shared = {
    api: null,
    cache: null,
    status: status,
    loggedStudent: {},
    mongo: client,
};

export const COLLECTIONS: {
    students: Collection;
    coalitions: Collection;
    sessions: Collection;
    logs: Collection;
    projects: Collection;
    seats: Collection;
    requests: Collection;
} = {
    students: null,
    coalitions: null,
    sessions: null,
    logs: null,
    projects: null,
    seats: null,
    requests: null,
};

export default shared;
