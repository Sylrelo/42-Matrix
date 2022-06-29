/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import "animate.css";
import "./search.css";
import "./style.scss";

import { useEffect, useMemo, useRef, useState } from "react";

//@ts-ignore
import { MapInteractionCSS } from "react-map-interaction";
import { Link } from "react-router-dom";
import SearchIcon from "../../Assets/sarchIcon";
import BlockLine from "../../Components/BlockLine";
import { get } from "../../Utils/http";
import CoalitionWidget from "../Coalitions/Widget";
import { useRecoilValue } from "recoil";
import { IsPool } from "../../Atoms/Auth";

export const MONTHS_NAME = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export const isPool = (student: any): boolean => {
    if (!student) return false;

    return (
        student.pool_month === MONTHS_NAME[new Date().getMonth()].toLowerCase() &&
        student.pool_year === new Date().getFullYear().toString()
    );
};

const UNAIL = [
    "z4r9p3",
    "z4r5p3",
    "z4r1p3",
    "z3r1p3",
    "z3r5p3",
    "z3r9p3",
    "z3r13p4",
    "z3r13p5",
    "z3r13p6",
    "z2r1p4",
    "z2r5p4",
    "z2r9p4",
    "z1r1p3",
    "z1r5p3",
    "z1r9p3",
];

type SeatProps = {
    location?: string;
    selectedStudent?: string;
    student?: any;
    unavailable: boolean;
};

const Seat = ({ location, student, unavailable, selectedStudent }: SeatProps) => {
    const isCurrentlyLoggedStudentPool = useRecoilValue(IsPool);

    const getClass = (() => {
        let classes = "";

        if (unavailable) return "unavailable ";

        if (student) {
            classes += "bg-slate-700 student";
            if (student.login === selectedStudent) classes += " focused";
            else if (selectedStudent) classes += " disabled";

            if (isPool(student)) classes += " pool";
            else if (!isPool(student) && isCurrentlyLoggedStudentPool) classes += " not-pool";
            return classes;
        } else return "bg-slate-800 ";
    })();

    const customStyle = useMemo(() => {
        const style: Record<string, string> = {};

        if (!student) return {};

        if (student?.coalition) style.border = `4px solid ${student.coalition?.color}`;
        if (student?.image_url) style.backgroundImage = `url(${student.image_url})`;

        return style;
    }, [student]);

    return (
        <Link to={"/profile/" + student?.id} state={{ ...student }}>
            <div className={"seat " + getClass}>
                <div className="loading-placeholder">
                    <div className="profile-image " style={customStyle}>
                        <div className={isPool(student) ? "pool-filter" : ""} />
                        <div className="group-badges">
                            {(student?.groups ?? []).map((group: any) => (
                                <div key={group.id} className={group.name}>
                                    {group.name}
                                </div>
                            ))}

                            {isPool(student) && <div className="pool">Pool</div>}
                            {student?.login === "slopez" && <div className="daddymatrix">Matrix</div>}
                        </div>

                        <div className="login">{student?.login}</div>
                        <div className={"location " + (student ? "active" : "text-slate-500")}>{location}</div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const Clusters = () => {
    const [studentLocations, setStudentLocations] = useState([]);
    // const [_, setLoggedStats] = useState({});

    const [size, setSize] = useState({ value: 1, v: "vw", width: 0, height: 0 });
    const [currentCluster, setCurrentCluster] = useState(0);

    const intervalRef = useRef<NodeJS.Timer | null>(null);
    const interactiveContainerRef = useRef<HTMLDivElement>(null);
    const interfaceContainerRef = useRef<HTMLDivElement>(null);

    const [testInter, setIntestInte] = useState({
        scale: 0.5,
        translation: { x: 0, y: 0 },
    });

    const [searchString, setSearchString] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const [showSearchOverlay, setShowSearchOverlay] = useState(false);

    const _onResize = () => {
        setSize({
            value: Math.min(window.innerHeight, window.innerWidth),
            v: window.innerHeight < window.innerWidth ? "vh" : "vw",
            width: window.innerWidth,
            height: window.innerHeight,
        });
    };

    useEffect(() => {
        _getLocations();
        _onResize();

        window.addEventListener("resize", _onResize);

        intervalRef.current = setInterval(() => _getLocations(), 15000);

        return () => {
            window.removeEventListener("resize", _onResize);
            clearInterval(intervalRef.current as NodeJS.Timer);
        };
    }, []);

    const _getLocations = async () => {
        try {
            const result = await get<any>("locations");
            // const resultStats = await get<any>("logged_stats");

            // setLoggedStats(resultStats);
            setStudentLocations(result);
        } catch (error) {
            console.error(error);
        }
    };

    const _generateCluster = (
        leftZone: string,
        leftRows: number,
        leftColumns: number,
        rightZone: string,
        rightRows: number,
        rightColumns: number
    ) => {
        const rows = [];
        const biggestRows = leftRows > rightRows ? leftRows : rightRows;

        for (let i = 0; i < biggestRows; i++) {
            const columns = [];

            for (let j = 0; j < leftColumns + rightColumns + 1; j++) {
                const rightIndex = j - leftColumns - 1;

                let location = "";

                if (j < leftColumns) {
                    location = `${leftZone}r${i + 1}p${leftColumns - j}`;
                } else {
                    location = `${rightZone}r${i + 1}p${rightColumns - rightIndex}`;
                }

                const student = studentLocations.find((student: any) => {
                    return student.location.includes(location);
                });

                const unavailable = false;

                if (
                    (i >= rightRows && rightIndex >= 0) ||
                    (i >= leftRows && rightIndex < 0) ||
                    UNAIL.includes(location)
                ) {
                    columns.push(<td key={`empty-${location}`}></td>);
                } else if (j < leftColumns || rightIndex >= 0) {
                    columns.push(
                        <td
                            key={`seat-${location}`}
                            style={{
                                animationDelay: `${((i % biggestRows) + Math.random() * 5) / 30}s`,
                            }}
                            className="animate__animated animate__fadeIn animate__zoomIn">
                            <Seat
                                student={student}
                                unavailable={unavailable}
                                location={location}
                                selectedStudent={selectedStudent}
                            />
                        </td>
                    );
                } else {
                    columns.push(<td key={`allo-${location}`}></td>);
                }
            }

            rows.push(
                <tbody key={`container-${i}`}>
                    <tr>{columns}</tr>
                </tbody>
            );
        }

        return <table>{rows}</table>;
    };

    const setInterfactiveSize = () => {
        let minRatio = Math.min(size.width, size.height) / 1920.0;

        const test = size.height - (interfaceContainerRef.current?.offsetHeight! + 41 ?? 0);

        minRatio = Math.min(size.width, test) / 1920.0;

        setIntestInte({
            scale: minRatio,
            translation: {
                // x: 0,
                y: 0,
                x: (size.width - 1920 * minRatio) / 2,
                // y: (test - 1920 * minRatio) / 2,
            },
        });
    };

    useEffect(() => {
        setInterfactiveSize();
    }, [size, currentCluster]);

    const getHost = (host: string) => {
        const matches = host.match(/z([0-9]+)r([0-9]+)p([0-9]+)/);

        if (!matches) return { z: 0, r: 0, p: 0, str: "" };
        const result = { z: +matches[1]!, r: +matches[2]!, p: +matches[3]! };

        return {
            ...result,
            str: `z${result.z} r${result.r} p${result.p}`,
        };
    };

    const getHostString = (host: string) => {
        return getHost(host).str;
    };

    const ioActiveStudents = studentLocations.filter(
        (location: Record<string, any>) => location.location.includes("z1") || location.location.includes("z2")
    ).length;

    const discoveryActiveStudents = studentLocations.filter(
        (location: Record<string, any>) => location.location.includes("z3") || location.location.includes("z4")
    ).length;

    return (
        <div>
            <div
                className={"search-overlay " + (showSearchOverlay ? "" : "hidden")}
                onClick={(event) => {
                    const target = event.target;

                    //@ts-ignore
                    if (target.classList.contains("search-overlay")) {
                        setShowSearchOverlay(false);
                        setSelectedStudent("");
                        setSearchString("");
                    }
                }}>
                <h3>search login</h3>
                <input type="text" value={searchString} onChange={(event) => setSearchString(event?.target.value)} />
                <div className="results">
                    {studentLocations
                        .filter((student: Record<string, any>) => student.login.includes(searchString))
                        .slice(0, 10)
                        .map((student: Record<string, any>) => (
                            <div
                                key={`search-key-${student.login}`}
                                className="search-item"
                                onClick={() => {
                                    setSelectedStudent(student.login);
                                    setShowSearchOverlay(false);

                                    const host = getHost(student.host);

                                    if ([3, 4].includes(host.z)) {
                                        setCurrentCluster(1);
                                    }
                                    if ([1, 2].includes(host.z)) {
                                        setCurrentCluster(0);
                                    }
                                }}>
                                <div
                                    className="search-avatar"
                                    style={{ backgroundImage: `url(${student.image_url})` }}
                                />
                                <div className="search-bar">
                                    <div className="search-login">{student.login}</div>
                                    <div className="search-host">{getHostString(student.location)}</div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <div className="parent-container">
                <div className="interface-container" ref={interfaceContainerRef}>
                    <div className="  flex flex-col items-center ">
                        <div className="w-80 mt-4 mb-4">
                            <ul className="  text-center text-gray-500 rounded-lg shadow flex text-gray-400">
                                <li className="w-full">
                                    <button
                                        onClick={() => {
                                            setCurrentCluster(0);
                                        }}
                                        className={
                                            "inline-block p-2 w-full rounded-l-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none hover:text-white hover:bg-gray-700 " +
                                            (currentCluster === 0 ? "bg-gray-700 text-white" : "bg-gray-800")
                                        }>
                                        IO
                                    </button>
                                </li>
                                <li className="w-full">
                                    <button
                                        onClick={() => {
                                            setCurrentCluster(1);
                                        }}
                                        className={
                                            "inline-block p-2 w-full hover:text-gray-700 hover:bg-gray-50 focus:outline-none hover:text-white hover:bg-gray-700 " +
                                            (currentCluster === 1 ? "bg-gray-700 text-white" : "bg-gray-800")
                                        }>
                                        Discovery
                                    </button>
                                </li>

                                <li>
                                    <button
                                        onClick={() => {
                                            setShowSearchOverlay(true);
                                        }}
                                        className={
                                            "inline-block p-2 rounded-r-lg hover:text-gray-700 hover:bg-gray-50 focus:outline-none hover:text-white hover:bg-gray-700 bg-gray-800"
                                        }>
                                        <SearchIcon size={28} />
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="flex md:flex-row flex-col content-start items-start ">
                            <div className="bg-gray-800 rounded-lg p-4 w-80">
                                <BlockLine message={`${ioActiveStudents} students`} label="IO" />
                                <BlockLine message={`${discoveryActiveStudents} students`} label="Discovery" />
                                <BlockLine
                                    message={
                                        <span className="font-bold">{`${
                                            ioActiveStudents + discoveryActiveStudents
                                        } students`}</span>
                                    }
                                    label="Total"
                                />
                            </div>
                            {/* <div className="w-5 h-5" />
                            <LoggedStats loggedStats={loggedStats} /> */}
                            <div className="w-5 h-5" />
                            <CoalitionWidget />
                        </div>
                        <div className="mt-4" />
                    </div>
                </div>

                <div className="interative-container" ref={interactiveContainerRef}>
                    <MapInteractionCSS maxScale={5} value={testInter} onChange={(value: any) => setIntestInte(value)}>
                        <div className="cluster-container">
                            {currentCluster === 1
                                ? _generateCluster("z4", 12, 7, "z3", 13, 6)
                                : _generateCluster("z2", 12, 8, "z1", 12, 5)}
                        </div>
                    </MapInteractionCSS>
                </div>
            </div>
        </div>
    );
};

export default Clusters;
