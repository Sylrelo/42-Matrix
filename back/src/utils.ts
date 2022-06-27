import { IStudent } from "./Interfaces/IStudent";

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

export const isPool = (user: IStudent): boolean => {
    return (
        user.pool_month === MONTHS_NAME[new Date().getMonth()].toLowerCase() &&
        user.pool_year === new Date().getFullYear().toString()
    );
};
