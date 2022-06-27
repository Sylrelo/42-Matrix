/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { get } from "../../Utils/http";

import { CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";

const StatusView = () => {
    const [apistat, setApistat] = useState<any[]>([]);
    const [matrixStat, setMatrixStat] = useState<any[]>([]);
    const [status, setStatus] = useState<any>({});

    const timeRef = useRef<NodeJS.Timeout | null>(null);

    const getRemoteStatData = (hour: number, remoteApi: Record<string, any>): Record<string, any> => {
        if (remoteApi[hour]) {
            return {
                name: `${hour}h`,
                count: remoteApi[hour].count,
                time: (remoteApi[hour].responseTime / remoteApi[hour].count).toFixed(2),
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

            setStatus(status);

            const intraApiStat = [];
            const matrixApiStat = [];

            const currentHour = new Date().getHours() + 1;

            for (let i = 0; i < 24 - currentHour; i++) {
                if (!status.remoteApi?.[i + currentHour] && !status.matrixApi?.[i + currentHour]) {
                    continue;
                }
                intraApiStat.push(getRemoteStatData(i + currentHour, status.remoteApi));
                matrixApiStat.push(getRemoteStatData(i + currentHour, status.matrixApi));
            }

            for (let i = 0; i < currentHour; i++) {
                intraApiStat.push(getRemoteStatData(i, status.remoteApi));
                matrixApiStat.push(getRemoteStatData(i, status.matrixApi));
            }

            setApistat(intraApiStat);
            setMatrixStat(matrixApiStat);
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
        </div>
    );
};

export default StatusView;
