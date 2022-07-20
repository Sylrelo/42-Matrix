"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stats = void 0;
class Stats {
    static LogRoute(route) {
        const currentHour = +new Date().getHours();
        if (!Stats.routeStats[currentHour] || currentHour !== Stats.lastRouteHours) {
            Stats.routeStats[currentHour] = {};
        }
        if (!Stats.routeStats[currentHour][route]) {
            Stats.routeStats[currentHour][route] = 0;
        }
        Stats.routeStats[currentHour][route] += 1;
        Stats.lastRouteHours = currentHour;
    }
    static Add(type, value) {
        const currentHour = +new Date().getHours();
        if (!Stats.data[type]) {
            Stats.data[type] = {};
        }
        if (!Stats.data[type][currentHour] || currentHour !== Stats.lastHour) {
            Stats.data[type][currentHour] = { min: 9999, max: 0, count: 0, total: 0 };
        }
        Stats.data[type][currentHour].min = Math.min(Stats.data[type][currentHour].min, value);
        Stats.data[type][currentHour].max = Math.max(Stats.data[type][currentHour].max, value);
        Stats.data[type][currentHour].total += value;
        Stats.data[type][currentHour].count += 1;
        Stats.lastHour = currentHour;
    }
    static Get() {
        return Stats.data;
    }
    static GetRouteStats() {
        return Stats.routeStats;
    }
}
exports.Stats = Stats;
Stats.lastHour = -1;
Stats.data = {};
Stats.lastRouteHours = -1;
Stats.routeStats = {};
//# sourceMappingURL=status.js.map