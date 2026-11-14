'use strict';

const assert = require('node:assert/strict');
const { resolveStagedListenHost, listenWithStagingGuard } = require('./staged-listen-host.cjs');

function fakeServer() {
    return {
        calls: [],
        listen(...args) {
            this.calls.push(args);
            return this;
        },
    };
}

test('production Passenger keeps existing listen(port, callback) even when no host is supplied', () => {
    const server = fakeServer();
    const cb = () => {};
    listenWithStagingGuard(server, 32442, cb, {
        APP_ENV: 'production',
        NEXT_PUBLIC_DEPLOYMENT_ENV: 'production',
    });
    assert.equal(server.calls.length, 1);
    assert.deepEqual(server.calls[0], [32442, cb]);
});

test('normal DEV Passenger also keeps existing listen(port, callback)', () => {
    const server = fakeServer();
    const cb = () => {};
    listenWithStagingGuard(server, 32123, cb, {
        APP_ENV: 'development',
        NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
        HOSTNAME: '127.0.0.1',
    });
    assert.deepEqual(server.calls[0], [32123, cb]);
});

test('isolated DEV smoke explicitly binds only loopback', () => {
    const env = {
        APP_ENV: 'development',
        NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
        SALONBW_STAGE_LOOPBACK_HOST: '127.0.0.1',
    };
    assert.equal(resolveStagedListenHost(env), '127.0.0.1');
    const server = fakeServer();
    const cb = () => {};
    listenWithStagingGuard(server, 32555, cb, env);
    assert.deepEqual(server.calls[0], [32555, '127.0.0.1', cb]);
});

test('loopback override fails closed on any non-loopback host', () => {
    for (const value of ['', '0.0.0.0', '::', 'localhost', '127.0.0.2']) {
        assert.throws(() => resolveStagedListenHost({
            APP_ENV: 'development',
            NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
            SALONBW_STAGE_LOOPBACK_HOST: value,
        }), /Unsafe staged-only HTTP binding request/);
    }
});

test('loopback override cannot apply to production or mixed environments', () => {
    for (const [app, deployment] of [
        ['production', 'production'],
        ['production', 'development'],
        ['development', 'production'],
        [undefined, 'development'],
    ]) {
        assert.throws(() => resolveStagedListenHost({
            APP_ENV: app,
            NEXT_PUBLIC_DEPLOYMENT_ENV: deployment,
            SALONBW_STAGE_LOOPBACK_HOST: '127.0.0.1',
        }), /Unsafe staged-only HTTP binding request/);
    }
});

test('invalid override cannot silently call server.listen', () => {
    const server = fakeServer();
    assert.throws(() => listenWithStagingGuard(server, 32222, () => {}, {
        APP_ENV: 'development',
        NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
        SALONBW_STAGE_LOOPBACK_HOST: '0.0.0.0',
    }));
    assert.equal(server.calls.length, 0);
});
