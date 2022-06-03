export const getStorageData = async <T>(items: T | null = null) => {
  return await new Promise<T>((resolve, reject) => {
    // Returns a Promise when callback is not specified in MV3+ (not released yet).
    chrome.storage.sync.get(items, (data: T) => {
      if (chrome.runtime.lastError !== undefined) {
        return reject(chrome.runtime.lastError)
      }
      resolve(data)
    })
  })
}
export const setStorageData = async <T>(items: T) => {
  return await new Promise<void>((resolve) => {
    chrome.storage.sync.set(items, resolve)
  })
}
export const removeStorageData = async (keys: string[]) => {
  return await new Promise<void>((resolve) => {
    chrome.storage.sync.remove(keys, resolve)
  })
}
