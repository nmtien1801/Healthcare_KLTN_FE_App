module.exports = function(api) {
  api.cache(true);
  return {
    presets: ["module:babel-preset-expo"], 
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      ["@babel/plugin-transform-private-methods", { loose: true }],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      "react-native-reanimated/plugin", 
    ],
  };
};