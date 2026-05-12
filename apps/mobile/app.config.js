// app.config.js — extends app.json with environment-conditional settings.
// EXPO_BASE_URL is set to /Karysm only in the GitHub Actions deploy workflow.
// Vercel and local dev leave it unset, so the app runs at root (/).
const base = require('./app.json');

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    experiments: {
      baseUrl: process.env.EXPO_BASE_URL || '',
    },
  },
};
