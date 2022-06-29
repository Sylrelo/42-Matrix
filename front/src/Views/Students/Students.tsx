import dayjs from "dayjs";
import Pagination from "rc-pagination";
import Select from "rc-select";
import Table from "rc-table";
import { FC } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { get } from "../../Utils/http";
import "./style.scss";
import "../../../node_modules/rc-select/assets/index.less";

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
    { title: "Achievements", render: (_: void, student: any) => student.achievements?.length ?? 0 },
    { title: "Titles", render: (_: void, student: any) => student.titles_users?.length ?? 0 },
];

const StudentsView: FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [filters, setFilters] = useState({ page: 0 });
    const [total, setTotal] = useState(0);
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        (async () => {
            const result = await get<any>(`students?page=${filters.page}`);

            setTotal(result.total);

            setSkills(result.skills);
            setStudents((result.students ?? []).map((student: any) => ({ ...student, key: student.id })));
        })();
    }, [filters.page]);

    return (
        <div className="container mx-auto">
            <div className="page-title"> Students (WIP)</div>

            {/*       <Select
                placeholder="Skill"
                options={skills.map((skill: any) => ({ label: skill.name, value: skill.id }))}
            />

            <br />
            <br />
            <br />
            <br />
            <br /> */}
            <div className="allo students-table">
                <Table style={{ width: "100%" }} columns={columns} data={students} />

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
