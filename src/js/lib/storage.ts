const chromeStorage = (local = false) => {
  const area = local ? 'local' : 'sync'
  return chrome.storage[area]
}
export const getStorageData = <T extends Record<string, any>>(items: T | null = null, local = false) => {
  return chromeStorage(local).get(items) as Promise<T>
}
export const setStorageData = <T extends Record<string, any>>(items: T, local = false) => {
  return chromeStorage(local).set(items)
}
export const removeStorageData = (keys: string[], local = false) => {
  return chromeStorage(local).remove(keys)
}
