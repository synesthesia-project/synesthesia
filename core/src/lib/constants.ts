export const DEFAULT_SYNESTHESIA_PORT = 8120;

/**
 * The path that downstream broadcast endpoints use to connect to an upstream endpoint.
 */
export const BROADCAST_UPSTREAM_WEBSOCKET_PATH = '/listen';
export const CONTROLLER_WEBSOCKET_PATH = '/control';

export const COMPOSER_PATH = '/composer';
export const DEFAULT_COMPOSER_URL = `http://localhost:${DEFAULT_SYNESTHESIA_PORT}${COMPOSER_PATH}`;
