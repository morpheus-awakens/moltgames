function createRegistry() {
  const modules = new Map();

  function register(module) {
    if (!module || !module.key) {
      throw new Error('Game module must define a unique key');
    }
    if (modules.has(module.key)) {
      throw new Error(`Game module already registered: ${module.key}`);
    }
    modules.set(module.key, module);
  }

  function get(key) {
    return modules.get(key);
  }

  function list() {
    return Array.from(modules.values()).map(mod => ({
      key: mod.key,
      name: mod.name,
      version: mod.version,
      minPlayers: mod.minPlayers,
      maxPlayers: mod.maxPlayers,
      roles: mod.roles
    }));
  }

  return {
    register,
    get,
    list
  };
}

module.exports = {
  createRegistry
};
