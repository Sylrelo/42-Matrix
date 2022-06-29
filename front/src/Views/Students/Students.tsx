/* eslint-disable react-hooks/exhaustive-deps */
import { Autocomplete, TextField } from "@mui/material";
import dayjs from "dayjs";
import Pagination from "rc-pagination";
import Table from "rc-table";
import { FC, useEffect, useRef, useState } from "react";
import { get } from "../../Utils/http";
import "./style.scss";
// import "../../../node_modules/rc-select/assets/index.less";

const columns = [
    {
        title: " ",
        dataIndex: "image_url",
        width: "42px",
        render: (image_url: string) => <span className="avtr" style={{ backgroundImage: `url(${image_url})` }} />,
    },
    {
        title: "login",
        dataIndex: "login",
        render: (login: string, student: any) => (
            <>
                <div>{login}</div>
                <div>
                    {student.last_name?.toUpperCase()} {student.first_name}
                </div>
            </>
        ),
    },
    {
        align: "center",
        title: "Promo",
        dataIndex: "pool_year",
        render: (year: number, student: any) => (
            <>
                <div>{student.pool_month}</div>
                <div>{year}</div>
            </>
        ),
    },
    {
        title: "Last update",
        dataIndex: "matrix_updated_at",
        render: (matrix_updated_at: number) =>
            matrix_updated_at ? dayjs(matrix_updated_at).format("YYYY/MM/DD HH:mm") : "Never",
    },
    {
        title: "Last seen",
        dataIndex: "last_seen",
        render: (last_seen: number) => (last_seen ? dayjs(last_seen).format("YYYY/MM/DD HH:mm") : "Never"),
    },
    { title: "Wallet", dataIndex: "wallet" },
    { title: "Points", dataIndex: "correction_point" },
    { title: "Projects", render: (_: void, student: any) => student.projects_users?.length ?? 0 },
    // { title: "Achievements", render: (_: void, student: any) => student.achievements?.length ?? 0 },
    // { title: "Titles", render: (_: void, student: any) => student.titles_users?.length ?? 0 },
];

interface IFilters {
    page: number;
    skillId: null | number;
    skillLevel: null | number;
}

const StudentsView: FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [filters, setFilters] = useState<IFilters>({ page: 0, skillId: null, skillLevel: null });
    const [total, setTotal] = useState(0);
    const [skills, setSkills] = useState([]);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        clearTimeout(timeoutRef.current as NodeJS.Timeout);

        timeoutRef.current = setTimeout(async () => {
            let queryFilters = [];

            if (filters.skillId && filters.skillLevel) {
                queryFilters.push(`skill_id=${filters.skillId}`);
                queryFilters.push(`skill_level=${filters.skillLevel}`);
            }

            const result = await get<any>(`students?page=${filters.page}&${queryFilters.join("&")}`);

            setTotal(result.total);

            setSkills(result.skills.sort());
            setStudents((result.students ?? []).map((student: any) => ({ ...student, key: student.id })));
        }, 250);
    }, [filters.page, filters.skillLevel]);

    return (
        <div className="container mx-auto page-students">
            <div className="page-title"> Students (WIP)</div>

            <div className="flex" style={{ width: "500px" }}>
                <Autocomplete
                    size="small"
                    onChange={(_, value) => {
                        if (!value) {
                            setFilters((old) => ({ ...old, skillId: null, skillLevel: null }));
                        } else {
                            setFilters((old) => ({ ...old, skillId: +value.id, skillLevel: null }));
                        }
                    }}
                    disablePortal
                    options={skills.map((skill: any) => ({ label: skill.name, id: skill.id }))}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Skill name" />}
                />
                <TextField
                    size="small"
                    label="Minimum skill level"
                    type={"number"}
                    disabled={!filters.skillId}
                    value={filters.skillLevel ?? ""}
                    onChange={(event) => {
                        const value = event.target.value;

                        if (!value) {
                            setFilters((old) => ({ ...old, skillLevel: null }));
                        } else {
                            setFilters((old) => ({ ...old, skillLevel: +value }));
                        }
                    }}
                />
            </div>

            {/* */}

            <div className="flex mt-4" style={{ width: "500px" }}>
                <Autocomplete
                    size="small"
                    disablePortal
                    id="combo-box-demo"
                    options={skills.map((skill: any) => ({ label: skill.name, id: skill.id }))}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Project name" />}
                />
            </div>

            <div className="allo students-table">
                <Table
                    style={{ width: "100%" }}
                    //@ts-ignore
                    columns={columns}
                    data={students}
                />

                <Pagination
                    total={total}
                    pageSize={20}
                    onChange={(page) => setFilters((old) => ({ ...old, page: page - 1 }))}
                />
            </div>
        </div>
    );
};

export default StudentsView;
