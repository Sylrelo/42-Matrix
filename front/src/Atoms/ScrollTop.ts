import { atom } from "recoil";

export const ScrollTopAtom = atom({
    key: "scrollTop",
    default: new Date().getTime(),
});
