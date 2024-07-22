export interface ErrorResponse {
    [key: string]: any;
}

export class WrongChainID extends Error {}
export class WrongCoinSymbol extends Error {}
export class ClientException extends Error {}
export class InvalidProxy extends ClientException {}
export class TransactionException extends Error {}
export class GasPriceTooHigh extends Error {}
export class APIException extends Error {}

export class HTTPException extends Error {
    response: ErrorResponse | null;
    status_code: number | null;

    constructor(response: ErrorResponse | null = null, status_code: number | null = null) {
        super();
        this.response = response;
        this.status_code = status_code;
    }
}
