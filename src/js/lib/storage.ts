const chromeStorage = (local = false) => {
  const area = local ? 'local' : 'sync'
  return chrome.storage[area]
}
export const getStorageData = async <T>(items: T | null = null, local = false) => {
  return await new Promise<T>((resolve, reject) => {
    // Returns a Promise when callback is not specified in MV3+ (not released yet).
    chromeStorage(local).get(items, (data: T) => {
      if (chrome.runtime.lastError !== undefined) {
        return reject(chrome.runtime.lastError)
      }
      resolve(data)
    })
  })
}
export const setStorageData = async <T>(items: T, local = false) => {
  return await new Promise<void>((resolve) => {
    chromeStorage(local).set(items, resolve)
  })
}
export const removeStorageData = async (keys: string[], local = false) => {
  return await new Promise<void>((resolve) => {
    chromeStorage(local).remove(keys, resolve)
  })
}
