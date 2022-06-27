interface LocalToken {
    token: string | null;
    refresh: string | null;
}

const UID_KEY = "_";
const TOKEN_KEY = "__";
const REFRESH_KEY = "___";

class LocalStore {
    static setToken(token: string, refresh: string) {
        window.localStorage.setItem(TOKEN_KEY, token);
        window.localStorage.setItem(REFRESH_KEY, refresh);
    }

    static getToken(): LocalToken {
        const token = window.localStorage.getItem(TOKEN_KEY);
        const refresh = window.localStorage.getItem(REFRESH_KEY);
        return { token, refresh };
    }

    static setUid(uid: string) {
        window.localStorage.setItem(UID_KEY, uid);
    }

    static getUid(): string | null {
        return window.localStorage.getItem(UID_KEY);
    }

    static clear() {
        window.localStorage.clear();
    }
}

export default LocalStore;
