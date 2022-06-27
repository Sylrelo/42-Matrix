/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export const colorFromStr = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += ("00" + value.toString(16)).substr(-2);
    }

    return color;
};

const LoggedStats = ({ loggedStats }: { loggedStats: Record<string, any> }) => {
    const [availableHour, setAvailableHour] = useState<number[]>([]);

    const shiftBy = (inputArray: any[], shiftBy: number) => {
        const tmp = [...inputArray];
        const total = tmp.length;
        const newArray: any[] = new Array(total);

        for (let i = 0; i < total; i++) {
            const newIndex = (i + shiftBy) % total;
            newArray[i] = tmp[newIndex];
        }

        return newArray;
    };

    const getStat = () => {
        const currentHour = new Date().getHours() + 1;

        const blabla: any = {};
        const lala: any[] = [];

        for (let i = 0; i < 24; i++) {
            if (!blabla[i]) {
                blabla[i] = {};
            }
            for (const pool in loggedStats[i]) {
                if (!blabla[i]?.[`${pool} min`]) {
                    blabla[i][`${pool} min`] = 0;
                }
                if (!blabla[i]?.[`${pool} max`]) {
                    blabla[i][`${pool} max`] = 0;
                }

                if (loggedStats[i]?.[pool]) {
                    blabla[i][`${pool} max`] = loggedStats[i][pool].max;
                    blabla[i][`${pool} min`] = loggedStats[i][pool].min;
                    blabla[i][`${pool} avg`] = Math.round(
                        loggedStats[i][pool].totalForAvg / loggedStats[i][pool].countForAvg
                    );
                }
            }
            if (!loggedStats[i]) {
                for (const hour of availableHour) {
                    blabla[i] = {
                        ...blabla[i],
                        [`${hour} avg`]: 0,
                        [`${hour} min`]: 0,
                        [`${hour} max`]: 0,
                    };
                }
            }
        }

        for (const bla in blabla) {
            lala.push({
                name: bla,
                ...blabla[bla],
            });
        }

        return shiftBy(lala, currentHour).slice(20, 24);
    };

    const stats = useMemo(() => {
        const available: number[] = [];

        for (const hour in loggedStats) {
            for (const pool of Object.keys(loggedStats[hour])) {
                if (!available.includes(+pool)) {
                    available.push(+pool);
                }
            }
        }

        setAvailableHour(available);

        return [...getStat()];
    }, [loggedStats]);

    return (
        <div className="bg-gray-800 rounded-lg w-80 p-1">
            <div className="" style={{ width: "314px", height: "96px" }}>
                <AreaChart data={stats} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} width={314} height={96}>
                    {availableHour.map((hour) => (
                        <React.Fragment key={`h-${hour}`}>
                            <Area
                                // type="monotone"

                                type="basis"
                                dataKey={`${hour} avg`}
                                stackId={`${hour} avg`}
                                // stroke="#ff0000"
                                stroke={colorFromStr(`${hour} avg`)}
                                fill={colorFromStr(`${hour} avg`)}
                                fillOpacity={0.1}
                            />

                            {/* <Area
                                    // type="monotone"
                                    dataKey={`${hour} min`}
                                    stackId={`${hour}`}
                                    // stroke={colorFromStr(`${hour} min`)}
                                    stroke={colorFromStr(`${hour} min`)}
                                    // stroke="#00ff00"
                                    fillOpacity={0}
                                    // fill={colorFromStr(`${hour} min`)}
                                /> */}
                        </React.Fragment>
                    ))}
                    <XAxis dataKey="name" />
                    <Tooltip />
                </AreaChart>
            </div>
        </div>
    );
};

export default LoggedStats;
