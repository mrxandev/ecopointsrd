const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = Array.from(
  new Set([...config.resolver.sourceExts, "cjs", "mjs", "json"])
);

module.exports = config;
