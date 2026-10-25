module.exports = {
    __esModule: true,
    default: new Proxy({}, { get: (_target, key) => String(key) }),
};
