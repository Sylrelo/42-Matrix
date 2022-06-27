/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "../../Utils/http";

import Table from "rc-table";
import Pagination from "rc-pagination";

import "./project.scss";
import dayjs from "dayjs";
import { statusName } from "./Projects";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const baseColumn = [
    {
        title: "",
        dataIndex: "image_url",
        width: "52px",
        render: (image: string) => <span className="avatar-table" style={{ backgroundImage: `url('${image}')` }} />,
    },
    { title: "Login", dataIndex: "login" },
    {
        title: "Registered at ",
        dataIndex: "project",
        render: (project: Record<string, any>) => dayjs(project.created_at).format("YYYY/MM/DD HH:mm"),
    },
];

const groupIdColumn = { title: "Group id", dataIndex: "project", render: (project: any) => project.current_team_id };

const createGroupColumn = [...baseColumn, groupIdColumn];

const finishedColumn = [
    ...baseColumn,
    {
        title: "Validated at",
        dataIndex: "project",
        render: (project: any) => dayjs(project.marked_at).format("YYYY/MM/DD HH:mm"),
    },
    { title: "Mark", dataIndex: "project", render: (project: any) => project.final_mark },
    { title: "Retries", dataIndex: "project", render: (project: any) => project.occurrence },
    groupIdColumn,
    // { title: "val", dataIndex: "project", render: (project: any) => (project["validated?"] ? "a" : "b") },
];
const inProgressColumn = [...createGroupColumn, groupIdColumn];
const waitingForCorrectionColumn = [...baseColumn, groupIdColumn];
// const searchingGroupColumn = [...baseColumn];

const MarkChart = ({ data }: { data: any[] }) => {
    const clampMark = (value: number) => {
        return value;
        // if (value === 125) return 125;
        // return `${Math.floor(value / 10) * 10}`;
    };

    const chartData = useMemo(() => {
        const finalChartData: any[] = [];

        for (const student of data) {
            const index = finalChartData.findIndex((chart) => chart.name === clampMark(student.project.final_mark));

            if (index === -1) {
                finalChartData.push({
                    name: clampMark(student.project.final_mark),
                    count: 1,
                });
            } else {
                finalChartData[index].count++;
            }
        }

        finalChartData.sort((a, b) => a.name - b.name);

        return finalChartData;
    }, [data]);

    return (
        <div style={{ height: "200px", width: "456px" }}>
            <div className="page-subtitle">Per mark</div>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <Bar dataKey="count" fill="#8884d8" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const StatusChart = ({ data }: { data: any }) => {
    const chartData = useMemo(() => {
        return Object.entries(data).map((chart) => ({
            name: statusName[chart[0]] ?? chart[0],
            value: (chart[1] as any[]).length,
        }));
    }, [data]);

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    return (
        <div style={{ height: "200px", width: "256px" }}>
            <div className="page-subtitle">Per status</div>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart width={150} height={40}>
                    <Pie dataKey="value" fill="#8884d8" data={chartData}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const ProjectDetailView = () => {
    const params = useParams();
    const [project, setProject] = useState<any>({});
    const [studentPerStatus, setStudentPerStatus] = useState<Record<string, any>>({});

    const getProject = async () => {
        try {
            const project = await get<any>("project/" + params.id);

            const tmp: Record<string, any> = {};

            for (const student of project.students) {
                if (!tmp[student.project.status]) {
                    tmp[student.project.status] = [];
                }
                tmp[student.project.status].push(student);
            }

            setStudentPerStatus(tmp);

            setProject(project);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getProject();
    }, []);

    const StudentProject = ({ status }: { status: string }) => {
        const [pagination, setPagination] = useState(1);

        const { columns, sortedData } = useMemo(() => {
            let columns = baseColumn;
            let sortedData: any[] = studentPerStatus[status] ?? [];

            switch (status) {
                case "creating_group":
                    columns = createGroupColumn;
                    break;
                case "finished":
                    columns = finishedColumn;
                    sortedData = sortedData.sort(
                        (a, b) => dayjs(b.project.marked_at).unix() - dayjs(a.project.marked_at).unix()
                    );
                    break;
                case "waiting_for_correction":
                    columns = waitingForCorrectionColumn;
                    break;
                case "in_progress":
                    columns = inProgressColumn;
                    break;
                default:
                    break;
            }

            sortedData = sortedData.slice(15 * (pagination - 1), 15 * pagination);
            sortedData = sortedData.map((data) => ({ ...data, key: `${status}-${data.login}` }));

            return { columns, sortedData };
        }, [status, pagination]);

        return (
            <>
                <Table columns={columns} data={sortedData} />
                <Pagination
                    total={studentPerStatus[status]?.length}
                    pageSize={15}
                    nextIcon={">"}
                    prevIcon={"<"}
                    showQuickJumper={false}
                    showSizeChanger={false}
                    onChange={(page) => setPagination(page)}
                    current={pagination}
                />
            </>
        );
    };

    const ShowStatusTable = ({ status }: { status: string }): JSX.Element => {
        return (
            <>
                {studentPerStatus?.[status] && (
                    <>
                        <div className="page-subtitle underlined">
                            {statusName[status]} ({studentPerStatus[status].length})
                        </div>
                        <StudentProject status={status} />
                    </>
                )}
            </>
        );
    };

    const projectSession = useMemo(() => {
        let tmp: any[] = project.project?.project_sessions ?? [];

        tmp.sort((a, b) => dayjs(b.created_at).unix() - dayjs(a.created_at).unix());

        return tmp[0];
    }, [project.project]);

    return (
        <div className="container mx-auto">
            <div className="page-title"> {project.project?.name}</div>
            (Page is still a work in progress)
            <div className="page-subtitle underlined">Project information</div>
            <div>{projectSession?.description}</div>
            <div>{projectSession?.difficulty?.toLocaleString("en")} xp</div>
            <div>{projectSession?.estimate_time}</div>
            <div className="page-subtitle underlined"> Stats</div>
            <div className="flex mb-8">
                <MarkChart data={studentPerStatus["finished"] ?? []} />
                <StatusChart data={studentPerStatus ?? {}} />
            </div>
            <div className="flex flex-col project-students-table">
                <ShowStatusTable status="searching_a_group" />
                <ShowStatusTable status="creating_group" />
                <ShowStatusTable status="in_progress" />
                <ShowStatusTable status="waiting_for_correction" />
                <ShowStatusTable status="finished" />
            </div>
        </div>
    );
};

export default ProjectDetailView;
