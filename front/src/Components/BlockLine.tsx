/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from "react";

type BlockLineProps = {
    label: string;
    message: string | number | JSX.Element;
    isLabelBold?: boolean;
    isMessageBold?: boolean;
    postfix?: string;
    prefix?: string;
    color?: string;
};

const BlockLine = ({
    label,
    message,
    isLabelBold = false,
    isMessageBold = false,
    postfix = "",
    prefix = "",
    color = "#ffffff",
}: BlockLineProps) => {
    const labelClasses = useMemo(() => {
        const classes: string[] = [];

        if (isLabelBold) classes.push("font-bold");
        return classes.join(" ");
    }, []);

    const messageClasses = useMemo(() => {
        const classes: string[] = [];

        if (isMessageBold) classes.push("font-bold");

        return classes.join(" ");
    }, []);

    return (
        <div className="flex justify-between" style={{ color: color }}>
            <div className={labelClasses}>{label}</div>
            <div className={messageClasses}>
                {prefix}
                {message}
                {postfix}
            </div>
        </div>
    );
};

export default BlockLine;
