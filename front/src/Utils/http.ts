import axios, { AxiosError, AxiosRequestConfig, AxiosRequestHeaders, Method } from "axios";
import LocalStore from "./storage";

let API_URL = "http://localhost:8080/api/";

export let REDIRECT_URL =
    "https://api.intra.42.fr/oauth/authorize?client_id=78203081c23848d53d5d1fad26e1c2ccbc7bc388788f54a71235d4103547e0e7&redirect_uri=http%3A%2F%2Flocalhost%3A3000&response_type=code";

if (document.location.href.includes("42.slopez.dev")) {
    API_URL = "https://42.slopez.dev/api/";
    REDIRECT_URL =
        "https://api.intra.42.fr/oauth/authorize?client_id=a01e84cf98f7ec66988d447778b851bde2f3abe92f7028d516075c13290a7f63&redirect_uri=https%3A%2F%2F42.slopez.dev%2F&response_type=code";
}

function _getHeaders(): AxiosRequestHeaders {
    const uid = LocalStore.getUid();

    return {
        Authorization: `${uid}`,
    };
}

function _getConfig(): AxiosRequestConfig {
    return {
        headers: _getHeaders(),
    };
}

function _getError(error: AxiosError & any) {
    console.error(error);
    throw new Error(error);
}

async function _request<T>(url: string, method: Method, data?: any): Promise<T | null> {
    try {
        const response = await axios(`${API_URL}${url}`, {
            ..._getConfig(),
            method,
            data,
        });
        return response?.data;
    } catch (error) {
        _getError(error);
    }
    return null;
}

export async function get<T>(url: string): Promise<T | null> {
    return _request(url, "GET");
}

export async function post<T>(url: string, data?: any): Promise<T | null> {
    return _request(url, "POST", data);
}
