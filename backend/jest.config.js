/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 20000,
    moduleFileExtensions: ['js', 'json'],
    moduleNameMapper: {
        '^puppeteer$': '<rootDir>/tests/mocks/puppeteer.js',
    },
};
