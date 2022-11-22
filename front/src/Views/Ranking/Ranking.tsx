/* eslint-disable react-hooks/exhaustive-deps */
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SetterOrUpdater, useSetRecoilState } from "recoil";
import { ScrollTopAtom } from "../../Atoms/ScrollTop";
import { get } from "../../Utils/http";

import "./style.scss";

// File to refactor

const RankingView = () => {
    const [studentRanking, setStudentRanking] = useState<Record<string, any>[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    const [selectedYear, setSelectedYear] = useState<number>(0);
    const [filters, setFilters] = useState<Record<string, boolean>>({
        showInactive: true,
        showBlackholed: true,
        showPoolOnly: false,
    });

    const [pagination, setPagination] = useState({
        currentPage: 0,
        totalItems: 0,
        perPage: 10,
    });

    const [loading, setLoading] = useState(false);

    const maxValue = useRef<Record<string, number>>({
        wallet: 0,
        level: 0,
        correction_point: 0,
        blackhole: 0,
    });

    const getMaxValuesCursus = (students: any[]) => {
        maxValue.current.blackhole = 0;
        maxValue.current.level = 0;

        for (const student of students) {
            if (student.blackholed_at) {
                student.daysToBlackhole = getBlackholeDayLeft(student.blackholed_at);
                maxValue.current.blackhole = Math.max(maxValue.current.blackhole, student.daysToBlackhole);
            }
            maxValue.current.level = Math.max(maxValue.current.level, student.level ?? 0);
        }
    };
    const getMaxValuesStudent = (students: any[]) => {
        maxValue.current.wallet = 0;
        maxValue.current.correction_point = 0;

        for (const student of students) {
            maxValue.current.correction_point = Math.max(
                maxValue.current.correction_point,
                student.correction_point ?? 0
            );
            maxValue.current.wallet = Math.max(maxValue.current.wallet, student.wallet ?? 0);
        }
    };

    const getCursusRanking = (key: string, order: number = 1) => {
        let tmp = [...studentRanking];

        tmp = tmp.filter((stud) => (selectedYear ? +stud.pool_year === selectedYear : true));

        if (!filters.showInactive)
            tmp = tmp.filter((stud) => stud.last_seen && dayjs().diff(dayjs(stud.last_seen), "M") <= 6);

        tmp = tmp.map((student) => ({ ...student, cursus_users: undefined, ...(student.cursus_users?.[0] ?? {}) }));

        if (key === "blackholed_at") {
            tmp.sort((a, b) => (+dayjs(b[key] ?? 0) - +dayjs(a[key] ?? 0)) * order);
        } else {
            tmp.sort((a, b) => ((b[key] ?? 0) - (a[key] ?? 0)) * order);
        }

        getMaxValuesCursus(tmp);

        return tmp.slice(
            0 + pagination.perPage * pagination.currentPage,
            pagination.perPage * (pagination.currentPage + 1)
        );
    };

    const getStudentRanking = (key: string, order: number = 1) => {
        let tmp = [...studentRanking];

        tmp = tmp.filter((stud) => (selectedYear ? +stud.pool_year === selectedYear : true));

        if (!filters.showInactive)
            tmp = tmp.filter((stud) => stud.last_seen && dayjs().diff(dayjs(stud.last_seen), "M") <= 6);

        tmp.sort((a, b) => (b[key] - a[key]) * order);
        getMaxValuesStudent(tmp);

        return tmp.slice(
            0 + pagination.perPage * pagination.currentPage,
            pagination.perPage * (pagination.currentPage + 1)
        );
    };

    const getBlackholeDayLeft = (blackholed_at: number) => {
        const today = new Date().getTime();
        const diff = (new Date(blackholed_at).getTime() - today) / 1000;

        const days = Math.round(diff / 86400);

        return days >= 0 ? days : 0;
    };

    const _getRanking = async () => {
        try {
            setLoading(true);
            const result =
                (await get<Record<string, any>>(`ranking?display_pool=${filters.showPoolOnly ? 1 : 0}`)) ?? [];

            setAvailableYears(result.availableYears.sort((a: number, b: number) => b - a));
            setStudentRanking(result.ranking);

            for (const rnk of result.ranking) {
                if (!rnk.cursus_users) {
                    console.error(rnk);
                }
            }
            setPagination({ totalItems: result.ranking.length, currentPage: 0, perPage: 15 });

            maxValue.current = {
                wallet: 0,
                level: 0,
                correction_point: 0,
                blackhole: 0,
            };
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        _getRanking();
    }, [filters.showPoolOnly]);

    const PaginationButton = ({ scrollTop, i }: { scrollTop: SetterOrUpdater<number>; i: number }) => {
        return (
            <button
                onClick={() => {
                    scrollTop(new Date().getTime());
                    setPagination((old) => ({ ...old, currentPage: i }));
                }}
                className={"pagination-button " + (pagination.currentPage === i ? "active" : "")}
                type="button">
                {i + 1}
            </button>
        );
    };

    const Pagination = () => {
        const ScrollTop = useSetRecoilState(ScrollTopAtom);

        const btn = useMemo(() => {
            const tmp = [];
            const totalPage = Math.round(pagination.totalItems / pagination.perPage);

            const minusP = Math.max(0, pagination.currentPage - 2);
            const posifP = Math.min(totalPage, pagination.currentPage + 3);

            if (minusP > 0) {
                tmp.push(<PaginationButton key={0} i={0} scrollTop={ScrollTop} />);
                tmp.push(<span className="pagination-button text-center">...</span>);
            }

            for (let i = minusP; i < posifP; i++) {
                tmp.push(<PaginationButton key={i} scrollTop={ScrollTop} i={i} />);
            }

            if (posifP < totalPage - 1) {
                tmp.push(<span className="pagination-button text-center">...</span>);
                tmp.push(<PaginationButton key={totalPage - 1} i={totalPage - 1} scrollTop={ScrollTop} />);
            }
            return tmp;
        }, []);

        return (
            <div className="flex justify-items-center align-items-center">
                {btn.map((k, i) => (
                    <React.Fragment key={i}>{k}</React.Fragment>
                ))}
            </div>
        );
    };

    const View = ({
        student,
        data,
        position,
    }: {
        student: Record<string, any>;
        data: string;
        position: number;
    }): JSX.Element => {
        const classes = useMemo(() => {
            const classes: string[] = [];

            if (student.cursus_users?.[0] && dayjs(student.cursus_users[0]?.blackholed_at).isBefore(dayjs())) {
                classes.push("blackholed");
            }

            if (!student.last_seen || dayjs().diff(dayjs(student.last_seen), "M") > 6) {
                classes.push("inactive");
            }

            return classes.join(" ");
        }, [student]);

        return (
            <Link to={"/profile/" + student?.id} state={{ ...student }}>
                <div
                    className={
                        "animate__animated animate__flipInX ranking-container " +
                        classes +
                        (position === 0 && pagination.currentPage === 0 ? " first " : "")
                    }
                    style={{
                        animationDelay: `${position / 30}s`,
                    }}>
                    <div className="abosorbed_at">
                        Absorbed since {dayjs(student?.cursus_users?.[0]?.blackholed_at).format("YYYY/MM/DD")}
                    </div>
                    <div className="avatar" style={{ backgroundImage: `url(${student.image?.versions?.medium})` }}></div>
                    <div className="login-name">{student.login}</div>
                    <div className="data">{data === "level" ? student[data]?.toFixed(2) : student[data]}</div>
                    <div className="position">{position + 1 + pagination.perPage * pagination.currentPage}</div>
                    <div className="bar">
                        <div
                            className="fill"
                            style={{
                                width: `calc(${(student[data] / maxValue.current[data]) * 100}% )`,
                            }}></div>
                    </div>
                </div>
            </Link>
        );
    };

    const RankItem = ({
        student,
        data,
        dataDisplayed,
        position,
        maxValueKey,
    }: {
        student: Record<string, any>;
        data: number;
        dataDisplayed: string;
        position: number;
        maxValueKey: string;
    }): JSX.Element => {
        return (
            <Link to={"/profile/" + student?.id} state={{ ...student }}>
                <div
                    className={
                        "animate__animated animate__flipInX ranking-container " +
                        (position === 0 && pagination.currentPage === 0 ? "first " : "")
                    }
                    style={{
                        animationDelay: `${position / 30}s`,
                    }}>
                    <div className="position">{position + 1 + pagination.perPage * pagination.currentPage}</div>
                    <div className="avatar" style={{ backgroundImage: `url(${student.image_url})` }}></div>
                    <div className="login-name">{student.login}</div>
                    <div className="data">{dataDisplayed}</div>
                    <div className="bar">
                        <div
                            className="fill"
                            style={{
                                width: `calc(${(data / maxValue.current[maxValueKey]) * 100}% )`,
                            }}></div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="container mx-auto">
            <div className="w-5 h-5" />
            <div className="flex justify-center">
                <div className="bg-gray-800 rounded-lg p-4 w-80">
                    <div className="pl-4 text-center uppercase font-bold mb-4">Filters</div>
                    <select
                        className="w-100 pool-select"
                        value={selectedYear}
                        onChange={(event) => {
                            const value = event.target.value;
                            setSelectedYear(+value);
                        }}>
                        <option value="all" key={0}>
                            show every years
                        </option>
                        {availableYears.map((pool) => (
                            <option key={pool}>{pool}</option>
                        ))}
                    </select>

                    <select
                        className="w-100 pool-select"
                        value={filters.showInactive ? "all" : "active"}
                        onChange={(event) => {
                            const value = event.target.value;
                            setFilters((old) => ({ ...old, showInactive: value === "all" }));
                        }}>
                        <option value="all" key={0}>
                            show inactive students
                        </option>
                        <option value="active" key={1}>
                            show only active students
                        </option>
                    </select>

                    <select
                        className="w-100 pool-select"
                        value={filters.showPoolOnly ? "pool" : "student"}
                        onChange={(event) => {
                            const value = event.target.value;
                            setFilters((old) => ({ ...old, showPoolOnly: value === "pool" }));
                        }}>
                        <option value="student" key={0}>
                            show students ranking
                        </option>
                        <option value="pool" key={1}>
                            show pool ranking
                        </option>
                    </select>
                    {/* 
                    <select
                        className="w-100 pool-select"
                        value={filters.showBlackholed ? "all" : "active"}
                        onChange={(event) => {
                            const value = event.target.value;
                            setFilters((old) => ({ ...old, showBlackholed: value === "all" }));
                        }}>
                        <option value="all" key={0}>
                            show blackholed students
                        </option>
                        <option value="active" key={0}>
                            do not show blackholed students
                        </option>
                    </select> */}
                </div>
            </div>
            <div className="flex justify-between overflow-x-auto">
                <div>
                    <div className="rank-title min-w320">level</div>
                    {loading ? <div className="loading" /> : ""}
                    {getCursusRanking("level").map((student, index) => (
                        <View key={"level-" + student.login} student={student} data="level" position={index} />
                    ))}
                </div>
                <div>
                    <div className="rank-title min-w320">correction points</div>
                    {loading ? <div className="loading" /> : ""}
                    {getStudentRanking("correction_point").map((student, index) => (
                        <View
                            key={"points-" + student.login}
                            student={student}
                            data="correction_point"
                            position={index}
                        />
                    ))}
                </div>
                <div>
                    <div className="rank-title min-w320">wallets</div>
                    {loading ? <div className="loading" /> : ""}
                    {getStudentRanking("wallet").map((student, index) => (
                        <View key={"wallet-" + student.login} student={student} data="wallet" position={index} />
                    ))}
                </div>

                {!filters.showPoolOnly && (
                    <div>
                        <div className="rank-title min-w320">blackhole</div>
                        {loading ? <div className="loading" /> : ""}
                        {getCursusRanking("blackholed_at")
                            .filter((student) => student.daysToBlackhole)
                            .map((student, index) => (
                                <RankItem
                                    key={"blackholed-" + student.login}
                                    student={student}
                                    dataDisplayed={`${student.daysToBlackhole} j`}
                                    data={student.daysToBlackhole}
                                    maxValueKey="blackhole"
                                    position={index}
                                />
                            ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col justify-items-center mt-4">
                <Pagination />
            </div>
        </div>
    );
};

export default RankingView;
