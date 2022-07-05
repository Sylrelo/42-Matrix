import { atom } from "recoil";

export const AuthAtom = atom({
    key: "auth",
    default: false,
});

export const IsAuthenticatingAtom = atom({
    key: "isAuthenticating",
    default: false,
});

export const IsPool = atom({
    key: "isPool",
    default: false,
});

export const IsAdminAtom = atom({
    key: "isAdmin",
    default: false,
});
