// Identity stand-in for Next.js CSS module class names in Jest.
module.exports = new Proxy({}, { get: (_target, key) => typeof key === 'string' ? key : undefined });
