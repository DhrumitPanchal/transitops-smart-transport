const memory = new Map()

module.exports = {
  getItemAsync: jest.fn(async (key) =>
    memory.has(key) ? memory.get(key) : null,
  ),
  setItemAsync: jest.fn(async (key, value) => {
    memory.set(key, String(value))
  }),
  deleteItemAsync: jest.fn(async (key) => {
    memory.delete(key)
  }),
  __clearMemory: () => memory.clear(),
  __getMemory: () => memory,
}
