import { Coalition } from "./Updater/Coalitions";
import { Location } from "./Updater/Location";
import { Student } from "./Updater/Student";

export const student = new Student();
export const location = new Location();
export const coalition = new Coalition();

export const START_TIME = +new Date();
export let CONFIG = { CLIENT_SECRET: "" };
