/* eslint-disable react-hooks/exhaustive-deps */
import { Autocomplete, TextField } from "@mui/material";
import dayjs from "dayjs";
import Pagination from "rc-pagination";
import Table from "rc-table";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { get } from "../../Utils/http";
import "./style.scss";
// import "../../../node_modules/rc-select/assets/index.less";

interface IFilters {
    [index: string]: any;
    page: number;
    skillId: null | number;
    skillLevel: null | number;
    loginSort: null | number;
    levelSort: null | number;
    walletSort: null | number;
    pointSort: null | number;
}

const StudentsView: FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [filters, setFilters] = useState<IFilters>({
        page: 0,
        skillId: null,
        skillLevel: null,
        loginSort: 1,
        walletSort: null,
        pointSort: null,
        levelSort: null,
    });
    const [total, setTotal] = useState(0);
    const [skills, setSkills] = useState([]);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const headerClick = (data: any, sortKey: string) => {
        return {
            onClick: () => {
                const tmp = filters[sortKey];

                console.log(sortKey, tmp);
                setFilters((old) => ({
                    ...old,
                    loginSort: null,
                    walletSort: null,
                    levelSort: null,
                    pointSort: null,
                    [sortKey]: tmp,
                }));

                if (tmp == null) {
                    setFilters((old) => ({ ...old, [sortKey]: 1 }));
                } else if (tmp === 1) {
                    setFilters((old) => ({ ...old, [sortKey]: -1 }));
                } else if (tmp === -1) {
                    setFilters((old) => ({ ...old, [sortKey]: null }));
                }
            },
        };
    };

    const columns = useMemo(() => {
        return [
            {
                title: " ",
                dataIndex: "image_url",
                width: "42px",
                render: (image_url: string) => (
                    <span className="avtr" style={{ backgroundImage: `url(${image_url})` }} />
                ),
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
                onHeaderCell: (data: any) => headerClick(data, "loginSort"),

                // onHeaderCell: (allo: any) => {
                //     console.log(allo);
                // },
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
            {
                title: "Level",
                dataIndex: "cursus_users",
                render: (cursus: any[]) => cursus?.[0]?.level?.toFixed(2),
                onHeaderCell: (data: any) => headerClick(data, "levelSort"),
            },
            {
                title: "Wallet",
                dataIndex: "wallet",
                render: (wallet: string) => wallet + " ₳",
                onHeaderCell: (data: any) => headerClick(data, "walletSort"),
            },
            {
                title: "Points",
                dataIndex: "correction_point",
                onHeaderCell: (data: any) => headerClick(data, "pointSort"),
            },
            {
                title: "Blackhole",
                dataIndex: "cursus_users",
                render: (cursus: any[]) => {
                    if (!cursus?.[0]?.blackholed_at) return "";
                    const daysToBlackhole = dayjs(cursus[0].blackholed_at).diff(dayjs(), "day");

                    if (daysToBlackhole < 0) {
                        return "Since " + dayjs(cursus[0].blackholed_at).format("YYYY/MM/DD");
                    } else {
                        return `${daysToBlackhole} days`;
                    }
                },
            },
            // { title: "Projects", render: (_: void, student: any) => student.projects_users?.length ?? 0 },
            // { title: "Achievements", render: (_: void, student: any) => student.achievements?.length ?? 0 },
            // { title: "Titles", render: (_: void, student: any) => student.titles_users?.length ?? 0 },
        ];
    }, [filters.loginSort, filters.walletSort, filters.levelSort, filters.pointSort]);

    useEffect(() => {
        clearTimeout(timeoutRef.current as NodeJS.Timeout);

        timeoutRef.current = setTimeout(async () => {
            let queryFilters = [];

            if (filters.skillId && filters.skillLevel) {
                queryFilters.push(`skill_id=${filters.skillId}`);
                queryFilters.push(`skill_level=${filters.skillLevel}`);
            }

            if (filters.walletSort) queryFilters.push(`wallet_sort=${filters.walletSort}`);
            else if (filters.pointSort) queryFilters.push(`point_sort=${filters.pointSort}`);
            else if (filters.levelSort) queryFilters.push(`level_sort=${filters.levelSort}`);
            else queryFilters.push(`login_sort=${filters.loginSort ?? 1}`);

            const result = await get<any>(`students?page=${filters.page}&${queryFilters.join("&")}`);

            setTotal(result.total);

            setSkills(result.skills.sort());
            setStudents((result.students ?? []).map((student: any) => ({ ...student, key: student.id })));
        }, 250);
    }, [filters.page, filters.skillLevel, filters.loginSort, filters.walletSort, filters.levelSort, filters.pointSort]);

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
                    disabled={true}
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
                    // onHeaderRow={(data, index) => {
                    //     return {
                    //         onClick: (event) => {
                    //             console.log(data, event, index);
                    //         },
                    //     };
                    // }}
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
