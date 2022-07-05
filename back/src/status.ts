interface IStats {
    [index: string]: { [index: number]: { max: number; min: number; count: number; total: number } };
}
export class Stats {
    private static lastHour = -1;
    private static data: IStats = {};

    static Add(type: string, value: number) {
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
}
