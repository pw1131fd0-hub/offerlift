module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'assets/js/**/*.js',
    'index.html'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
};
