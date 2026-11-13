'use strict';

/**
 * A MyDevil Passenger launch must keep its existing Node listen semantics.
 * Only an isolated, loopback HTTP smoke process may override the bind host.
 *
 * The explicit test-only variable is never shipped in .env.runtime.json.
 */
function resolveStagedListenHost(env = process.env) {
    if (!Object.prototype.hasOwnProperty.call(env, 'SALONBW_STAGE_LOOPBACK_HOST')) {
        return null;
    }
    if (
        env.SALONBW_STAGE_LOOPBACK_HOST !== '127.0.0.1' ||
        env.APP_ENV !== 'development' ||
        env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development'
    ) {
        throw new Error('Unsafe staged-only HTTP binding request');
    }
    return '127.0.0.1';
}

/** Keep the original .listen(port, callback) on every normal Passenger start. */
function listenWithStagingGuard(server, port, callback, env = process.env) {
    const host = resolveStagedListenHost(env);
    return host
        ? server.listen(port, host, callback)
        : server.listen(port, callback);
}

module.exports = { resolveStagedListenHost, listenWithStagingGuard };
