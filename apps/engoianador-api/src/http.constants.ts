const OK = 200;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const PAYLOAD_TOO_LARGE = 413;
const TOO_MANY_REQUESTS = 429;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;

export const HTTP_STATUS = {
  ok: OK,
  noContent: NO_CONTENT,
  badRequest: BAD_REQUEST,
  notFound: NOT_FOUND,
  payloadTooLarge: PAYLOAD_TOO_LARGE,
  tooManyRequests: TOO_MANY_REQUESTS,
  badGateway: BAD_GATEWAY,
  serviceUnavailable: SERVICE_UNAVAILABLE,
} as const;

export const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
