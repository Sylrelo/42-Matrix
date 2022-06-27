import * as http from "http";

export interface Responses {
    json: Function;
}

export interface RouteData {
    queries: Record<string, any>[];
    body?: string;
    jsonBody?: Record<string, any>;
}

export class Router {
    private _request: http.IncomingMessage;
    private _response: http.ServerResponse;
    private _fn: Function | null;

    private _possibleResponses: Responses = {
        json: this._jsonResponse,
    };

    constructor(request: http.IncomingMessage, response: http.ServerResponse) {
        this._request = request;
        this._response = response;
    }

    private _checkUrl(url: string) {
        return this._request.url.includes(url);
    }

    static jsonResponse(data: Record<any, any> | any[]): string {
        return JSON.stringify(data);
    }

    private _jsonResponse(data: Record<any, any> | any[]) {
        this._response.end(JSON.stringify(data));
    }

    public handle() {
        if (this._fn == null) {
            this._response.writeHead(200);
            this._response.end("---");
        }

        this._fn(
            {
                queries: [],
                body: null,
                jsonBody: null,
            },
            this._possibleResponses
        );
    }

    public get(url: string, fn: Function) {
        if (!this._checkUrl(url) && this._request?.method?.toLowerCase() !== "get") {
            return;
        }
        this._fn = fn;
    }

    public post(url: string, fn: Function) {
        if (!this._checkUrl(url) && this._request?.method?.toLowerCase() !== "post") {
            return;
        }
        this._fn = fn;
    }

    public put(url: string, fn: Function) {
        if (!this._checkUrl(url) && this._request?.method?.toLowerCase() !== "put") {
            return;
        }
        this._fn = fn;
    }

    public delete(url: string, fn: Function) {
        if (!this._checkUrl(url) && this._request?.method?.toLowerCase() !== "delete") {
            return;
        }
        this._fn = fn;
    }
}
