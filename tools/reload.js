
function noCache(module) {
  require("fs").watchFile(require("path").resolve(module), () => {
    delete require.cache[require.resolve(module)];
  });
}

function reload(module) {
  const cacheEntry = require.resolve(module);
  delete require.cache[cacheEntry];
  return require(module);
}

module.exports = {
  noCache,
  reload
};
