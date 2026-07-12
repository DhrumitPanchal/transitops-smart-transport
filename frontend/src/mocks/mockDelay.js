export function mockDelay(ms) {
  const min = 200
  const max = 400
  const wait =
    typeof ms === 'number'
      ? ms
      : Math.floor(Math.random() * (max - min + 1)) + min

  return new Promise((resolve) => {
    setTimeout(resolve, wait)
  })
}
