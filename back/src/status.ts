import shared from "./shared";

let lastHour = -1;

export const newResponseTime = (value: number) => {
    const currentHour = new Date().getHours();

    if (!shared.status.remoteApi[currentHour] || currentHour !== lastHour) {
        shared.status.remoteApi[currentHour] = { responseTime: 0, count: 0 };
    }

    shared.status.remoteApi[currentHour].responseTime += value;
    shared.status.remoteApi[currentHour].count++;
    lastHour = currentHour;
};

export const addMatrixApiRequestStat = (value: number) => {
    const currentHour = new Date().getHours();

    if (!shared.status.matrixApi[currentHour] || currentHour !== lastHour) {
        shared.status.matrixApi[currentHour] = { responseTime: 0, count: 0 };
    }

    shared.status.matrixApi[currentHour].responseTime += value;
    shared.status.matrixApi[currentHour].count++;
    lastHour = currentHour;
};

export const logConnected = (promo: number, value: number) => {
    const currentHour = new Date().getHours();

    if (!shared.loggedStudent?.[currentHour]) {
        shared.loggedStudent[currentHour] = {};
    }

    if (!shared.loggedStudent[currentHour]?.[promo] || currentHour !== lastHour) {
        shared.loggedStudent[currentHour][promo] = {
            min: 0,
            max: 0,
            countForAvg: 0,
            totalForAvg: 0,
        };
    }

    shared.loggedStudent[currentHour][promo].max = Math.max(shared.loggedStudent[currentHour][promo].max, value);
    shared.loggedStudent[currentHour][promo].min = Math.max(shared.loggedStudent[currentHour][promo].min, value);

    shared.loggedStudent[currentHour][promo].totalForAvg += value;
    shared.loggedStudent[currentHour][promo].countForAvg++;
    lastHour = currentHour;
};
