/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Clusters from "./Views/Cluster/Cluster";
import Login from "./Views/Login";

import { FiLogOut, FiUsers } from "react-icons/fi";

import { useEffect, useRef } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import "./Assets/ellipsis-spinner.css";
import ListIcon from "./Assets/ListIcon";
import MapIcon from "./Assets/MapIcon";
import ProjectIcon from "./Assets/ProjectIcon";
import StatusIcon from "./Assets/StatusIcon";
import { AuthAtom, IsAdminAtom, IsAuthenticatingAtom, IsPool } from "./Atoms/Auth";
import { ScrollTopAtom } from "./Atoms/ScrollTop";
import "./global.scss";
import { post } from "./Utils/http";
import LocalStore from "./Utils/storage";
import CoalitionsView from "./Views/Coalitions/Coalitions";
import ProfileView from "./Views/Profile/Profile";
import ProjectDetailView from "./Views/Projects/ProjectDetail";
import ProjectsView from "./Views/Projects/Projects";
import RankingView from "./Views/Ranking/Ranking";
import StatusView from "./Views/Status/Status";
import StudentsView from "./Views/Students/Students";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

export const AppBar = () => {
    const [_, setAuth] = useRecoilState(AuthAtom);
    const isPool = useRecoilValue(IsPool);

    return (
        <>
            <nav className="bg-white border-gray-200 px-2 px-4 py-2.5 rounded bg-gray-800 fixed z-10 w-screen">
                <div className="container flex flex-wrap justify-between items-center mx-auto">
                    <Link to="/clusters" className="flex items-center">
                        {/* <img src="42_Logo.svg" className="mr-3 h-6 sm:h-9" alt="Flowbite Logo" /> */}
                        <span className="self-center text-xl font-semibold whitespace-nowrap text-white">
                            The Matrix
                        </span>
                    </Link>

                    <div className=" w-full block w-auto" id="mobile-menu">
                        <ul className="flex  mt-4 flex-row space-x-4 mt-0 text-sm font-medium">
                            <li>
                                <Link
                                    to="/clusters"
                                    className="block py-2 pr-1 pl-1 hover:bg-transparent text-gray-400  hover:bg-gray-700 hover:text-white">
                                    <MapIcon size={36} />
                                </Link>
                            </li>
                            {!isPool && (
                                <li>
                                    <Link
                                        to="/students"
                                        className="block py-2 pr-1 pl-1 hover:bg-transparent text-gray-400  hover:bg-gray-700 hover:text-white">
                                        <FiUsers size={20} />
                                    </Link>
                                </li>
                            )}

                            <li>
                                <Link
                                    to="/ranking"
                                    className="block py-2 pr-1 pl-1 hover:bg-transparent text-gray-400  hover:bg-gray-700 hover:text-white">
                                    <ListIcon size={26} />
                                </Link>
                            </li>
                            {!isPool && (
                                <li>
                                    <Link
                                        to="/projects"
                                        className="block py-2 pr-1 pl-1 hover:bg-transparent text-gray-400  hover:bg-gray-700 hover:text-white">
                                        <ProjectIcon size={26} />
                                    </Link>
                                </li>
                            )}
                            {!isPool && (
                                <li>
                                    <Link
                                        to="/status"
                                        className="block py-2 pr-1 pl-1 hover:bg-transparent text-gray-400  hover:bg-gray-700 hover:text-white">
                                        <StatusIcon size={26} />
                                    </Link>
                                </li>
                            )}
                            <li>
                                <Link
                                    to="/"
                                    onClick={() => {
                                        post("logout");
                                        LocalStore.clear();
                                        setAuth(false);
                                    }}
                                    className="block py-2 pr-1 pl-1 hover:bg-transparent text-gray-400  hover:bg-gray-700 hover:text-white">
                                    <FiLogOut size={20} />
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            {/* <div className="mt-14" /> */}
        </>
    );
};

function App() {
    const [auth, setAuth] = useRecoilState(AuthAtom);
    const [, setIsAuthenticating] = useRecoilState(IsAuthenticatingAtom);
    const [, setIsPool] = useRecoilState(IsPool);
    const [, setIsAdmin] = useRecoilState(IsAdminAtom);
    const scrollTopAtom = useRecoilValue(ScrollTopAtom);

    const containerRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const navigate = useNavigate();

    const _tryAuth = async () => {
        try {
            if (document.location.href.includes("?code=")) return;

            setIsAuthenticating(true);

            const response = await post<any>("auth_verify");

            setIsPool(response.is_pool);
            setIsAdmin(response.is_admin);

            setAuth(true);

            if (location.pathname === "/") navigate("clusters");
        } catch (error) {
            console.error(error);
            navigate("/");
            setAuth(false);
        } finally {
            setIsAuthenticating(false);
        }
    };

    useEffect(() => {
        _tryAuth();
    }, []);

    useEffect(() => {
        // Scroll back to the top on page changes
        window.scroll(0, 0);
        containerRef.current?.scroll(0, 0);
    }, [location, scrollTopAtom]);

    return (
        <>
            {auth && <AppBar />}
            <ThemeProvider theme={darkTheme}>
                <div className="primary-container">
                    <div style={{ paddingTop: "52px" }} />
                    <div className="secondary-container" ref={containerRef}>
                        <Routes>
                            <Route path="/" element={<Login />} />
                            {auth && (
                                <>
                                    <Route path="/clusters" element={<Clusters />} />
                                    <Route path="/ranking" element={<RankingView />} />
                                    <Route path="/coalitions" element={<CoalitionsView />} />
                                    <Route path="/projects" element={<ProjectsView />} />
                                    <Route path="/projects/:id" element={<ProjectDetailView />} />
                                    <Route path="/status" element={<StatusView />} />
                                    <Route path="/profile/:id" element={<ProfileView />} />
                                    <Route path="/students" element={<StudentsView />} />
                                </>
                            )}
                        </Routes>
                        <div className="pb-24" />
                    </div>
                </div>
            </ThemeProvider>
        </>
    );
}

export default App;
