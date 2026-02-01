const { getDefaultConfig } = require('expo/metro-config');

// Set the app root for expo-router
process.env.EXPO_ROUTER_APP_ROOT = './app';

const config = getDefaultConfig(__dirname);

module.exports = config;
