import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { get } from "../../Utils/http";

const CoalitionsView = () => {
    const [coalitions, setCoalitions] = useState<any[]>([]);

    const getCoalitions = async () => {
        try {
            const coa = await get<any[]>("coalitions?limit=24");
            setCoalitions((coa ?? []).sort((a, b) => b.score - a.score));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getCoalitions();
    }, []);

    const stats = useMemo(() => {
        const coas: Record<string, any> = {};

        for (const coalition of coalitions) {
            if (!coas[coalition.name]) {
                coas[coalition.name] = {
                    color: coalition.color,
                    name: coalition.name,

                    data: [],
                };
            }
            coas[coalition.name].data.push({
                ...coalition,
                date: dayjs(coalition.date).format("DD/MM/YYYY"),
            });
        }

        return Object.values(coas).sort((a, b) => b.data?.[0]?.score - a.data?.[0]?.score);
    }, [coalitions]);

    return (
        <div className="container mx-auto">
            <div className="page-title">Coalitions</div>
            {(stats ?? []).map((stat) => (
                <>
                    <div className="page-subtitle font-bold mb-2" style={{ color: stat.color }}>
                        {stat.name} {stat.data?.[0]?.score?.toLocaleString()}
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart width={500} height={400} data={stat?.data ?? []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="score" stroke="#8884d8" fill={stat?.color} />
                        </AreaChart>
                    </ResponsiveContainer>
                </>
            ))}
        </div>
    );
};

export default CoalitionsView;
