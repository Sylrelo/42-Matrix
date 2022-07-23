import { useEffect, useState } from "react";
import BlockLine from "../../Components/BlockLine";
import { get } from "../../Utils/http";
import "./style.scss";

const CoalitionWidget = () => {
    const [coalitions, setCoalitions] = useState<any[]>([]);

    const getCoalitions = async () => {
        try {
            const coa = await get<any[]>("coalitions");
            setCoalitions((coa ?? []).sort((a, b) => b.score - a.score));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getCoalitions();
    }, []);

    return (
        // <Link to={"/coalitions"}>
        <div className="bg-gray-800 rounded-lg p-4 w-80">
            {coalitions.map((coalition, index) => (
                <BlockLine
                    color={coalition.color}
                    isLabelBold={index === 0}
                    isMessageBold={index === 0}
                    key={coalition.name}
                    message={coalition.score.toLocaleString()}
                    label={coalition.name}
                />
            ))}
        </div>
        //</Link>
    );
};

export default CoalitionWidget;
