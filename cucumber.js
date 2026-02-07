module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: ["tests/support/**/*.ts", "tests/steps/**/*.tsx"],
    paths: ["tests/features/**/*.feature"],
    format: ["progress-bar"],
  },
};
