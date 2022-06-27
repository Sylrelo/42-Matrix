/* eslint-disable react-hooks/exhaustive-deps */
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Area, AreaChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import BlockLine from "../../Components/BlockLine";
import { get } from "../../Utils/http";
import "./style.scss";

//TODO : A TYPER

const ListProjects = ({ projects }: { projects: Record<string, any>[] }): JSX.Element => {
    const sortedProject = useMemo(() => {
        projects.sort((a, b) => new Date(b.validated_at).getTime() - new Date(a.validated_at).getTime());
        return projects;
    }, [projects]);

    return (
        <>
            <table className="allo">
                <thead>
                    <tr>
                        <td>Project name</td>
                        <td>Validated at</td>
                        <td>Mark</td>
                    </tr>
                </thead>
                <tbody>
                    {(sortedProject ?? []).map((project: Record<string, any>, i: number) => (
                        <tr key={i}>
                            <td>{project.name}</td>
                            <td>{dayjs(project.validated_at).format("DD/MM/YYYY")}</td>
                            <td>{project.final_mark}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

const StatsProject = ({ projects }: { projects: Record<string, any>[] }): JSX.Element => {
    const colorPerStatus = {
        finished: "#005500",
        in_progress: "#000055",
        waiting_for_correction: "#335500",
        creating_group: "#005555",
        searching_a_group: "#005555",
    };

    const data = useMemo((): Record<string, any> => {
        const projectsTmp: any[] = [];

        if (!Array.isArray(projects)) {
            return { projects: [], status: [] };
        }

        projects.sort((a, b) => new Date(a.validated_at).getTime() - new Date(b.validated_at).getTime());

        for (const project of projects) {
            if (!project.validated_at || !project.validated) {
                continue;
            }

            projectsTmp.push({
                name: project.name,
                mark: project.final_mark,
                date: dayjs(project.validated_at).format("YY/MM/DD"),
            });
        }

        const projectStatus: Record<string, number> = {};

        for (const project of projects) {
            if (!projectStatus[project.status]) {
                projectStatus[project.status] = 0;
            }
            projectStatus[project.status]++;
        }

        const statusTmp = Object.keys(projectStatus).map((status: string) => ({
            name: status,
            value: projectStatus[status],
        }));

        return { projects: projectsTmp, status: statusTmp };
    }, [projects]);

    const renderLabel = (entry: any) => {
        return entry.value;
    };

    return (
        <div className="flex flex-col md:flex-row align-content-center align-items-center ">
            <div className="w-80 grow">
                <div className="mb-2 font-bold">Project mark graph</div>
                <ResponsiveContainer width={"100%"} height={250}>
                    <AreaChart
                        data={data.projects}
                        margin={{
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                        }}>
                        <XAxis dataKey="date" max={125} />
                        <YAxis />

                        <Area dataKey="mark" stroke="#8884d8" fill="#8884d8" max={125}>
                            <LabelList dataKey="name" position="top" content={renderLabel} />
                        </Area>

                        <Tooltip />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="w-80">
                <div className="mb-2 font-bold">Project status</div>
                <ResponsiveContainer width={"100%"} height={250}>
                    <PieChart>
                        <Pie data={data.status} dataKey="value" nameKey="name" outerRadius={80}>
                            {data.status.map((entry: any, index: number) => (
                                //@ts-ignore
                                <Cell key={index} fill={colorPerStatus?.[entry.name]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const ProfileView = () => {
    return <>Temporarily disabled, migrating from SQLite to MongoDB</>;
    const location = useLocation();

    const [studentData, setStudentData] = useState<Record<string, any>>({});

    const student = useMemo((): Record<string, any> => {
        return (location.state as Record<string, any>) ?? {};
    }, [location]);

    const getStudentData = async () => {
        try {
            const response = (await get<Record<string, any>>("student/" + student.id)) ?? {};

            console.log(response);

            setStudentData(response);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getStudentData();
    }, []);

    return (
        <div className="container mx-auto p-2">
            <div className="page-title">{student.login}</div>

            <div className="flex flex-col md:flex-row">
                <div className="profile-avatar" style={{ backgroundImage: `url(${student.image_url})` }} />
                <div className="m-2" />
                <div className="flex flex-col profile-box">
                    <BlockLine isMessageBold label="Name" message={studentData.student?.display_name ?? "-"} />
                    <BlockLine isMessageBold label="Level" message={studentData.cursus?.level ?? "-"} />
                    <BlockLine
                        isMessageBold
                        label="Correction points"
                        message={studentData.student?.correction_points ?? "-"}
                    />
                    <BlockLine isMessageBold label="Wallets" message={studentData.student?.wallets ?? "-"} />
                    <BlockLine
                        isMessageBold
                        label="Blackhole"
                        message={studentData.projects?.length ?? "-"}
                        postfix=" j"
                    />
                    <BlockLine
                        isMessageBold
                        label="Last seen"
                        message={
                            studentData.student?.last_seen
                                ? dayjs(studentData.student?.last_seen).format("DD/MM/YYYY HH[h]mm")
                                : "-"
                        }
                    />
                </div>
            </div>

            <div className="level-container mt-4 mb-4">
                <div
                    className="level-inside"
                    style={{
                        width: `${(studentData.cursus?.level / Math.round(studentData.cursus?.level + 1.5)) * 100}%`,
                    }}></div>
                <div className="level">{studentData.cursus?.level}</div>
            </div>

            <div className="mt-4 mb-4">
                <StatsProject projects={studentData.projects} />
            </div>
            <div className="p-4">
                <ListProjects projects={(studentData.projects ?? []).filter((project: any) => project.validated)} />
            </div>
        </div>
    );
};

export default ProfileView;
