/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import {
    AiOutlineCheck,
    AiOutlineEdit,
    AiOutlineFieldTime,
    AiOutlineSearch,
    AiOutlineUsergroupAdd,
} from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import BlockLine from "../../Components/BlockLine";
import { get } from "../../Utils/http";

export const statusName: { [index: string]: string } = {
    finished: "Finished",
    in_progress: "In progress",
    searching_a_group: "Searching a group",
    waiting_for_correction: "Waiting for correction",
    creating_group: "Creating a group",
};

const ProjectsView = () => {
    const navigate = useNavigate();

    const [projectsList, setProjectList] = useState<any[]>([]);
    const [studentStats, setStudentStats] = useState<any[]>([]);
    const [projectSearchQuery, setProjectSearchQuery] = useState<string>("");

    const [filterBy, setFilterBy] = useState<string>("finished");
    const [filterOrder, setFilterOrder] = useState(1);

    const countByKey = (project: Record<string, any>, status: string) => {
        return (
            studentStats.find((stat: any) => stat._id?.status === status && stat._id?.project_id === project.id)
                ?.count ?? 0
        );
    };

    const getCount = (project: Record<string, any>, status: string) => {
        const count = countByKey(project, status);

        if (+count !== 0) {
            return count;
        }

        return <span style={{ opacity: "0.45" }}>{count}</span>;
    };

    const getProjectsList = async () => {
        try {
            let response = (await get<any>("projects")) ?? {};

            setStudentStats(response.studentProjects);
            setProjectList(response.projects);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredProjects = useMemo(() => {
        let tmp = [...projectsList];

        if (filterBy === "xp") {
            // a refaire
            tmp.sort(
                (a, b) => filterOrder * ((b.project_session?.difficulty ?? -1) - (a.project_session?.difficulty ?? -1))
            );
        } else {
            tmp.sort((a, b) => filterOrder * (countByKey(b, filterBy) - countByKey(a, filterBy)));
        }

        tmp = tmp.filter((project) => project.name?.toLowerCase()?.includes(projectSearchQuery));

        return tmp;
    }, [filterBy, projectsList, filterOrder, projectSearchQuery]);

    useEffect(() => {
        getProjectsList();
    }, []);

    const HeaderFilter = ({ label, filterKey }: { label: string | JSX.Element; filterKey: string }): JSX.Element => {
        const isActive = filterKey === filterBy;

        return (
            <div>
                <div
                    className="flex flex-row justify-center justify-items-center cursor-pointer"
                    onClick={() => {
                        if (isActive) {
                            if (filterOrder === -1) {
                                setFilterOrder(1);
                            } else {
                                setFilterOrder(-1);
                            }
                        } else {
                            setFilterOrder(1);
                            setFilterBy(filterKey);
                        }
                    }}>
                    <span
                        style={{
                            opacity: isActive ? "1" : "0.5",
                        }}>
                        {label}
                    </span>
                </div>
            </div>
        );
    };

    const stats = useMemo(() => {
        const countByStatus: { [index: string]: number } = {};

        for (const project of studentStats) {
            if (project._id.status === "parent") continue;

            if (!countByStatus?.[project._id.status]) {
                countByStatus[project._id.status] = project.count;
            }

            countByStatus[project._id.status] += project.count;
        }

        return Object.entries(countByStatus).sort((a, b) => b[1] - a[1]);
    }, [studentStats]);

    return (
        <div className="container mx-auto p-2 ">
            <div className="page-title">Projects</div>

            <div className="bg-gray-800 rounded-lg p-4 w-80">
                {stats.map((stat) => (
                    <BlockLine
                        isLabelBold={true}
                        key={stat[0]}
                        message={stat[1].toLocaleString("en")}
                        label={statusName[stat[0]] ?? stat[0]}
                    />
                ))}
            </div>

            <input
                className="project-search-input"
                type="text"
                placeholder="Search for a project ..."
                value={projectSearchQuery}
                onChange={(event) => {
                    setProjectSearchQuery(event.target.value?.toLowerCase());
                }}
            />

            <div className="flex flex-col justify-items-center justify-center  ">
                <table className="allo">
                    <thead>
                        <tr>
                            <td className="w-2/4 w-2/5	w-1/3">Project name</td>
                            <td className="w10p text-center ">
                                <HeaderFilter label="XP" filterKey="xp" />
                            </td>
                            <td className="w5p text-center" title="Finished">
                                <span className="md:block hidden text-sm opacity-50	">Finished</span>
                                <HeaderFilter label={<AiOutlineCheck />} filterKey="finished" />
                            </td>
                            <td className="w5p text-center" title="In Progress">
                                <span className="md:block hidden text-sm opacity-50	">In progress</span>
                                <HeaderFilter label={<AiOutlineFieldTime />} filterKey="in_progress" />
                            </td>
                            <td className="w5p text-center" title="Waiting for correction">
                                <span className="md:block hidden text-sm opacity-50	">Waiting for correction</span>
                                <HeaderFilter label={<AiOutlineEdit />} filterKey="waiting_for_correction" />
                            </td>
                            <td className="w5p text-center" title="Searching for group">
                                <span className="md:block hidden text-sm opacity-50	">Searching group</span>
                                <HeaderFilter label={<AiOutlineSearch />} filterKey="searching_a_group" />
                            </td>
                            <td className="w5p text-center" title="Creating a group">
                                <span className="md:block hidden text-sm opacity-50	">Creating group</span>
                                <HeaderFilter label={<AiOutlineUsergroupAdd />} filterKey="creating_group" />
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map((project: any) => (
                            <tr
                                key={project.id + project.name}
                                onClick={() => {
                                    navigate("/projects/" + project.id);
                                }}>
                                <td className="">{project.name}</td>
                                <td className="text-center">
                                    {(
                                        project.project_session?.difficulty ??
                                        project.parent_difficulty ??
                                        -1
                                    ).toLocaleString("en-US")}
                                </td>
                                <td className="text-center">{getCount(project, "finished")}</td>
                                <td className="text-center">{getCount(project, "in_progress")}</td>
                                <td className="text-center">{getCount(project, "waiting_for_correction")}</td>
                                <td className="text-center">{getCount(project, "searching_a_group")}</td>
                                <td className="text-center">{getCount(project, "creating_group")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectsView;
