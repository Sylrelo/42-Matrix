import axios, { Method } from "axios";
import { CONFIG } from "./App";
import shared from "./shared";
import { Stats } from "./status";
const API_URL = "https://api.intra.42.fr/v2/";

class DeferredPromise<T> {
    promise: Promise<T>;
    reject: Function;
    resolve: Function;
    done: boolean;

    constructor() {
        this.done = false;

        this.promise = new Promise((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
        });

        this._init();
    }

    private async _init() {
        try {
            await this.promise;
        } catch (error) {
            console.error(error);
        } finally {
            this.done = true;
        }
    }
}

type TokenData = {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    created_at: number;
};

type PendingRequest = {
    createdAt: Date;
    active: boolean;
    headers?: Record<string, string>;
    data?: Record<string, string>;
    uri: string;
    method: Method;
    response: DeferredPromise<any>;
    priority: number;
    retries: number;
};
class FortyTwo {
    _tokenData: TokenData;
    _pendingRequest: PendingRequest[] = [];
    _pendingRequestObject: Record<string, PendingRequest> = {};

    constructor() {}

    public getTotalPendingRequest() {
        return Object.values(this._pendingRequestObject).length;
    }

    private async _post<T>(url: string, data: Record<any, string>): Promise<T> {
        const response = await axios.post(url, data);
        return response?.data;
    }

    public async refreshToken<T>(refreshToken: string): Promise<T> {
        return await this._add<T>(
            10,
            `${API_URL}oauth/token`,
            "POST",
            {},
            {
                grant_type: "refresh_token",
                client_id: process.env.UID,
                client_secret: CONFIG.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URL,
                refresh_token: refreshToken,
            }
        );
    }

    public async authorisationPost<T>(code: string): Promise<T> {
        // console.log(process.env.UID, process.env.SECRET, process.env.REDIRECT_URL);
        return await this._add<T>(
            10,
            `${API_URL}oauth/token`,
            "POST",
            {},
            {
                grant_type: "authorization_code",
                client_id: process.env.UID,
                client_secret: CONFIG.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URL,
                code,
            }
        );
    }

    private async _executePendingRequest(uri: string) {
        const request = this._pendingRequestObject[uri];

        if (request.response.done || request.active) {
            return;
        }
        const startTime = new Date().getTime();

        try {
            request.active = true;

            const response = await axios(request.uri, {
                headers: request.headers,
                method: request.method,
                data: request.data,
            });

            request.response.resolve(response.data);
            delete this._pendingRequestObject[uri];
        } catch (error) {
            request.response.reject(error);
            request.active = false;
            delete this._pendingRequestObject[uri];
        } finally {
            const endTime = new Date().getTime();
            Stats.Add("42Requests", endTime - startTime);
            Stats.LogRoute(uri);
        }
    }

    public handlePending() {
        setTimeout(async () => {
            const expireIn = new Date().getTime() / 1000 - this._tokenData?.created_at;

            if (expireIn <= 12) {
                console.log("Temporarily stopping pending request, token will expire soon.");
                this.handlePending();
                return;
            }

            const pendingArray = Object.values(this._pendingRequestObject).filter(
                (requests) => !requests.response.done
            );

            pendingArray.sort((a, b) => b.priority - a.priority);

            const active = pendingArray.filter((requests) => requests.active).length;

            for (let i = 0; i < +process.env.MAX_REQUEST_PER_SECONDS - active; i++) {
                if (!pendingArray?.[i]) {
                    continue;
                }
                this._executePendingRequest(pendingArray[i].uri);
            }

            this.handlePending();
        }, 1200);
    }

    private async _add<T>(
        priority: number,
        uri: string,
        method: Method,
        headers?: Record<string, string>,
        data?: Record<string, string>
    ): Promise<T> {
        const current = this._pendingRequestObject[uri];

        if (current) {
            return await current.response.promise;
        }

        this._pendingRequestObject[uri] = {
            response: new DeferredPromise(),
            uri,
            headers,
            method,
            createdAt: new Date(),
            active: false,
            data,
            priority: priority,
            retries: 0,
        };

        return await this._pendingRequestObject[uri].response.promise;
    }

    public async get<T>(url: string, priority?: number, ttl?: number): Promise<T> {
        try {
            const cachedResponse = await shared.cache.get(url);

            console.log(`[${!!cachedResponse ? "HIT" : "MISS"}] ${url}`);

            if (cachedResponse) {
                return cachedResponse as T;
            }

            const response = await this._add<T>(priority ?? 1, `${API_URL}${url}`, "GET", {
                Authorization: `Bearer ${this._tokenData.access_token}`,
                "Content-Type": "application/json",
            });

            shared.cache.set(url, response, ttl);
            return response;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public async getUser<T>(bearerToken: string, url: string, priority?: number, ttl?: number): Promise<T> {
        try {
            const cachedResponse = await shared.cache.get(url);
            if (cachedResponse) {
                return cachedResponse as T;
            }

            const response = await this._add<T>(priority ?? 1, `${API_URL}${url}`, "GET", {
                Authorization: `Bearer ${bearerToken}`,
                "Content-Type": "application/json",
            });

            shared.cache.set(url, response, ttl);
            return response;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public async getAllOffset<T>(
        url: string,
        perPage: number,
        offset: number,
        priority?: number,
        ttl?: number
    ): Promise<Record<string, any>> {
        try {
            let page = offset;
            let results: unknown[] = [];
            let lastResultCount = 0;

            while (true) {
                const response = await this.get<any[]>(`${url}&per_page=${perPage}&page=${page}`, priority, ttl);
                results = [...results, ...response];

                lastResultCount = response?.length;
                if (response?.length < perPage) {
                    if (response?.length === 0) {
                        page--;
                    }
                    break;
                }
                page++;
            }

            return {
                data: results,
                page,
                lastResultCount,
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public async getAll<T>(url: string, perPage: number = 30, priority?: number, ttl?: number): Promise<T> {
        try {
            let page = 0;
            let results: unknown[] = [];

            while (true) {
                const response = await this.get<any[]>(`${url}&per_page=${perPage}&page=${page}`, priority, ttl);
                results = [...results, ...response];

                if (response?.length < perPage) {
                    break;
                }
                page++;
            }

            return results as unknown as T;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public async getToken() {
        try {
            const expireIn = new Date().getTime() / 1000 - this._tokenData?.created_at;

            if (7200 - expireIn < 10) {
                console.log("Expires in", 7200 - expireIn);
            }

            if (this._tokenData && expireIn < 7200) {
                return;
            }

            this._tokenData = await this._post<TokenData>("https://api.intra.42.fr/oauth/token", {
                grant_type: "client_credentials",
                client_id: process.env.UID,
                client_secret: CONFIG.CLIENT_SECRET,
            });
            console.log("Got new token", this._tokenData.access_token);
        } catch (error) {
            console.error(error);
        }
    }
}

export default FortyTwo;
