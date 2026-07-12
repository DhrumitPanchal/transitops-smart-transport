let store = {}

const AsyncStorage = {
  setItem: jest.fn(async (key, value) => {
    store[key] = String(value)
  }),
  getItem: jest.fn(async (key) =>
    Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
  ),
  removeItem: jest.fn(async (key) => {
    delete store[key]
  }),
  clear: jest.fn(async () => {
    store = {}
  }),
  getAllKeys: jest.fn(async () => Object.keys(store)),
  multiGet: jest.fn(async (keys) =>
    keys.map((key) => [
      key,
      Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
    ]),
  ),
  multiSet: jest.fn(async (pairs) => {
    pairs.forEach(([key, value]) => {
      store[key] = String(value)
    })
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((key) => {
      delete store[key]
    })
  }),
}

module.exports = AsyncStorage
module.exports.default = AsyncStorage
