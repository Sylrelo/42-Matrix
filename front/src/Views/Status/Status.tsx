/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { get, post } from "../../Utils/http";

import Table from "rc-table";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRecoilValue } from "recoil";
import { IsAdminAtom } from "../../Atoms/Auth";

const columns = [
    { title: "Dest", dataIndex: "route", align: "left" },
    { title: "Count", dataIndex: "count", align: "center", className: "font-bold" },
];

const RouteHit: FC<{ data: any }> = ({ data }) => {
    const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

    const createRowStat = (result: any[], include: string, name: string) => {
        return {
            route: name,
            key: `${selectedHour}-${name}`,
            count: result
                .filter((route: any) => route.route.startsWith(include))
                .reduce((acc, prev: any) => prev.count + acc, 0),
        };
    };

    const array = useMemo(() => {
        if (!data?.[selectedHour]) return [];

        const result = Object.entries(data[selectedHour]).map((v) => ({
            route: v[0].replace("https://api.intra.42.fr/v2/", ""),
            count: v[1],
            key: `${selectedHour}-${v[0]}-${v[1]}`,
        }));

        result.sort((a: any, b: any) => b.count - a.count);

        result.push({
            route: "Total",
            count: result.reduce((acc, prev: any) => prev.count + acc, 0),
            key: `total${selectedHour}`,
        });
        result.push(createRowStat(result, "campus/9/locations", "Total locations update"));
        result.push(createRowStat(result, "users/", "Total users update"));

        return result;
    }, [data, selectedHour]);

    return (
        <div>
            <select
                value={selectedHour}
                className="w-100 pool-select"
                onChange={(evt) => {
                    setSelectedHour(+evt.target.value);
                }}>
                {Object.keys(data ?? {}).map((h: any, k) => (
                    <option value={h} key={k}>
                        {h} h
                    </option>
                ))}
            </select>

            <Table
                style={{ width: "100%" }}
                //@ts-ignore
                columns={columns}
                data={array}
            />
        </div>
    );
};

const StatusView = () => {
    const isAdmin = useRecoilValue(IsAdminAtom);

    const [apistat, setApistat] = useState<any[]>([]);
    const [matrixStat, setMatrixStat] = useState<any[]>([]);
    const [stalkingStats, setStalkingStats] = useState<any[]>([]);
    const [status, setStatus] = useState<any>({});
    // const [logs, setLogs] = useState<any[]>([]);

    const timeRef = useRef<NodeJS.Timeout | null>(null);

    const getRemoteStatData = (hour: number, remoteApi: Record<string, any>): Record<string, any> => {
        if (remoteApi?.[hour]) {
            return {
                name: `${hour}h`,
                count: remoteApi[hour].count,
                time: (remoteApi[hour].total / remoteApi[hour].count).toFixed(2),
                min: remoteApi[hour].min,
                max: remoteApi[hour].max,
            };
        }

        return {
            name: `${hour}h`,
            count: 0,
            time: 0,
        };
    };

    const getStatus = async () => {
        try {
            const status = (await get<Record<string, any>>("status")) ?? {};
            // const logs = (await get<any[]>("admin/logs")) ?? [];

            // setLogs(logs);
            setStatus(status);

            const intraApiStat = [];
            const matrixApiStat = [];
            const stalkingStats = [];

            const currentHour = new Date().getHours() + 1;

            for (let i = 0; i < 24 - currentHour; i++) {
                if (
                    !status.stats?.matrixRequests?.[i + currentHour] &&
                    !status.stats?.["42Requests"]?.[i + currentHour]
                ) {
                    continue;
                }
                intraApiStat.push(getRemoteStatData(i + currentHour, status.stats?.["42Requests"]));
                matrixApiStat.push(getRemoteStatData(i + currentHour, status.stats?.["matrixRequests"]));
                stalkingStats.push(getRemoteStatData(i + currentHour, status.stats?.["stalking"]));
            }

            for (let i = 0; i < currentHour; i++) {
                intraApiStat.push(getRemoteStatData(i, status.stats?.["42Requests"]));
                matrixApiStat.push(getRemoteStatData(i, status.stats?.["matrixRequests"]));
                stalkingStats.push(getRemoteStatData(i, status.stats?.["stalking"]));
            }

            setApistat(intraApiStat);
            setMatrixStat(matrixApiStat);
            setStalkingStats(stalkingStats);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getStatus();

        timeRef.current = setInterval(() => {
            getStatus();
        }, 10000);

        return () => {
            clearInterval(timeRef.current as NodeJS.Timeout);
            timeRef.current = null;
        };
    }, []);

    const LineDebug = ({ label, message }: { label: string; message: string | number | JSX.Element }) => {
        return (
            <div className="flex justify-between">
                <div>{label}</div>
                <div>{Number.isInteger(message) ? message.toLocaleString("en") : message}</div>
            </div>
        );
    };

    const getUptime = (): string => {
        const currentDate = new Date();
        const startDate = new Date(status.startTime);
        const diff = (currentDate.getTime() - startDate.getTime()) / 1000;

        const days = Math.round(diff / 86400);
        const hours = Math.round(diff / 3600) % 24;
        const minutes = Math.round(diff / 60) % 60;
        const seconds = Math.round(diff % 60);

        return `${days ? `${days}j` : ""} ${hours ? `${hours}h` : ""} ${minutes ? `${minutes}m` : ""} ${
            seconds ? `${seconds}s` : ""
        }`;
    };

    return (
        <div className="container mx-auto">
            <br />
            <div className="page-title">matrix debug page</div>
            {
                <div className="flex md:flex-row flex-col content-center items-start justify-items-center justify-center">
                    <div className="bg-gray-800 rounded-lg p-4 w-80 mr-4 ml-4">
                        <div className="pl-4 text-center uppercase font-bold mb-4">about</div>
                        <LineDebug label="Uptime" message={getUptime()} />
                        <LineDebug
                            label="Mongo data size"
                            message={((status?.dataSize ?? 0) / (1024 * 1024))?.toFixed(2) + " mb"}
                        />
                        <LineDebug
                            label="Mongo storage size"
                            message={((status?.storageSize ?? 0) / (1024 * 1024))?.toFixed(2) + " mb"}
                        />
                        <LineDebug label="Student currently stalking" message={status?.stalkingStudent} />
                    </div>

                    <div className="h-5 w-5" />
                    <div className="bg-gray-800 rounded-lg p-4 w-80 mr-4 ml-4">
                        <div className="pl-4 text-center uppercase font-bold mb-4">pending request</div>
                        <LineDebug label="Queue" message={status.pendingRequest} />
                        <LineDebug label="Active student update" message={status.activeUpdatePendingCount} />
                        <LineDebug label="Inactive student update" message={status.inactiveUpdatePendingCount} />
                        <LineDebug label="Updated in the last 24h" message={status.updateInTheLastDay} />
                        <LineDebug label="Recently seen" message={status.recentlySeen} />
                    </div>
                    <div className="h-5 w-5" />

                    <div className="bg-gray-800 rounded-lg p-4 w-80 mr-4 ml-4">
                        <div className="pl-4 text-center uppercase font-bold mb-4">Database state</div>
                        <LineDebug label="Students" message={status.totalStudent} />
                        <LineDebug label="Projects" message={status.projectsCount} />
                        {/* <LineDebug label="Student's projects" message={status.totalStudentProjects} /> */}
                        {/* <LineDebug label="Student's cursus" message={status.totalStudentCursus} /> */}
                        {/* <LineDebug label="Student's corrections" message={status.totalCorrectionCluster} /> */}
                    </div>
                </div>
            }
            <div className="flex flex-col sm:flex-row">
                <div className="grow w-full">
                    <div className="page-subtitle">Number of request to 42 API</div>
                    <ResponsiveContainer width={"100%"} height={300}>
                        <AreaChart data={apistat} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <Area dataKey="count" stroke="#008087" fill="#008087" type="monotone" />
                            <CartesianGrid strokeDasharray="2 4" stroke="#555555" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grow w-full">
                    <div className="page-subtitle"> 42 API average response time (ms)</div>

                    <ResponsiveContainer width={"100%"} height={300}>
                        <AreaChart data={apistat} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <Area dataKey="time" stroke="#25ae8d" fill="#25ae8d" type="monotone" />
                            <CartesianGrid strokeDasharray="2 4" stroke="#555555" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row">
                <div className="grow w-full">
                    <div className="page-subtitle">Matrix total request</div>
                    <ResponsiveContainer width={"100%"} height={300}>
                        <AreaChart data={matrixStat} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <Area dataKey="count" stroke="#008087" fill="#008087" type="monotone" />
                            <CartesianGrid strokeDasharray="2 4" stroke="#555555" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grow w-full">
                    <div className="page-subtitle"> Matrix average response time (ms)</div>
                    <ResponsiveContainer width={"100%"} height={300}>
                        <AreaChart data={matrixStat} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <Area dataKey="time" stroke="#25ae8d" fill="#25ae8d" type="monotone" />
                            <CartesianGrid strokeDasharray="2 4" stroke="#555555" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row">
                <div className="grow w-full">
                    <div className="page-subtitle">Stalking</div>
                    <ResponsiveContainer width={"100%"} height={300}>
                        <AreaChart data={stalkingStats} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <Area dataKey="min" stroke="#870700" fill="#870700" type="monotone" />
                            <Area dataKey="max" stroke="#008087" fill="#008087" type="monotone" />
                            <CartesianGrid strokeDasharray="2 4" stroke="#555555" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {isAdmin && (
                <>
                    <div className="mt-5 w-full">
                        <input
                            placeholder="New SECRET "
                            className="p-2"
                            type="text"
                            style={{ width: "400px" }}
                            onKeyUp={async (event) => {
                                const { key, target } = event;
                                const secret = (target as HTMLInputElement).value;

                                if (key !== "Enter") return;

                                try {
                                    (target as HTMLInputElement).disabled = true;
                                    await post("admin/change_secret", { secret });
                                } catch (error) {
                                    console.error(error);
                                } finally {
                                    (target as HTMLInputElement).disabled = false;
                                    (target as HTMLInputElement).value = "";
                                }
                            }}
                        />
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                post("admin/pull", {});
                            }}
                            type="button"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Pull
                        </button>
                        <button
                            onClick={() => {
                                post("admin/restart", {});
                            }}
                            type="button"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Restart server
                        </button>
                    </div>

                    {/* {logs.map((log) => (
                        <div key={log._id} className="mt-2 mb-2 rounded p-2">
                            [{dayjs(log.created_at).format("DD/MM HH:mm:ss")}] [{log.type}]{" "}
                            {(log.data ?? []).map((d: any) => JSON.stringify(d))}
                        </div>
                    ))} */}

                    <RouteHit data={status.routeStats} />
                </>
            )}
        </div>
    );
};

export default StatusView;
