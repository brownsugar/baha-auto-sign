import {
  configLocalPrefix,
  defConfig,
  defConfigLocal,
  getConfig,
  getConfigLocal
} from './lib/config'
import { setStorageData } from './lib/storage'

(async () => {
  const camelize = (s: string) =>
    s.replace(new RegExp(`^${configLocalPrefix}`), '')
      .replace(/-./g, x => x[1].toUpperCase())

  const config = await getConfig()
  const configLocal = await getConfigLocal()

  // Init form data
  document.querySelectorAll('form input').forEach((el: HTMLInputElement) => {
    const id = el.id
    const isLocal = id.startsWith(configLocalPrefix)
    const key = camelize(id)

    const baseConfig = isLocal ? configLocal : config
    if (key in baseConfig) {
      const type = el.type
      if (type === 'checkbox') {
        el.checked = baseConfig[key]
      } else {
        el.value = baseConfig[key]
      }
    }
  })
  // Listen to form change event
  document.querySelector('form')?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    if (e.type === 'change' && target !== null) {
      const id = target.id
      const type = target.type
      const value = type === 'checkbox'
        ? target.checked
        : target.value
      const isLocal = id.startsWith(configLocalPrefix)
      const key = camelize(id)

      const baseConfig = isLocal ? defConfigLocal : defConfig
      if (key in baseConfig) {
        setStorageData({
          [key]: value
        }, isLocal)
      }
    }
  })
})()
