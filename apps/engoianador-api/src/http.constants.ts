const OK = 200;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const LENGTH_REQUIRED = 411;
const PAYLOAD_TOO_LARGE = 413;
const UNSUPPORTED_MEDIA_TYPE = 415;
const TOO_MANY_REQUESTS = 429;
const INTERNAL_ERROR = 500;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;

export const HTTP_STATUS = {
  ok: OK,
  noContent: NO_CONTENT,
  badRequest: BAD_REQUEST,
  forbidden: FORBIDDEN,
  notFound: NOT_FOUND,
  lengthRequired: LENGTH_REQUIRED,
  unsupportedMediaType: UNSUPPORTED_MEDIA_TYPE,
  internalError: INTERNAL_ERROR,
  payloadTooLarge: PAYLOAD_TOO_LARGE,
  tooManyRequests: TOO_MANY_REQUESTS,
  badGateway: BAD_GATEWAY,
  serviceUnavailable: SERVICE_UNAVAILABLE,
} as const;

export const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
export const JSON_MEDIA_TYPE = 'application/json';
