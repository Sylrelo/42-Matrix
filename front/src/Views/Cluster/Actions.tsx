import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { get } from "../../Utils/http";

import "./actions.scss";

const LastActions = () => {
    const [actions, setLastActions] = useState<any[]>([]);

    useEffect(() => {
        get<any[]>("actions").then((response) => setLastActions(response ?? []));
    }, []);

    const getLabel = (project: any) => {
        if (project.final_mark > 0) {
            return (
                <>
                    &nbsp;validated <b>{project.project.name}</b> at <b>{project.final_mark}</b>.
                </>
            );
        }
        return (
            <>
                &nbsp;failed <b>{project.project.name}</b> :(.
            </>
        );
    };

    return (
        <div className="actions-container">
            {actions.map((action) => (
                <div className="action">
                    <div className="project-markedat">
                        {action.projects_users.marked_at
                            ? dayjs(action.projects_users.marked_at).format("DD/MM HH:mm")
                            : ""}
                    </div>
                    <span className="name">{action?.login}</span>
                    {getLabel(action.projects_users)}
                </div>
            ))}
        </div>
    );
};

export default LastActions;
