import { defConfig, getConfig } from './lib/config'
import { setStorageData } from './lib/storage'

(async () => {
  const camelize = (s: string) => s.replace(/-./g, x => x[1].toUpperCase())
  const config = await getConfig()

  // Init form data
  document.querySelectorAll('form input').forEach((el: HTMLInputElement) => {
    const id = el.id
    const key = camelize(id)
    if (key in defConfig) {
      const type = el.type
      if (type === 'checkbox') {
        el.checked = config[key]
      } else {
        el.value = config[key]
      }
    }
  })
  // Listen to form change event
  document.querySelector('form')?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    if (e.type === 'change' && target !== null) {
      const id = target.id
      const key = camelize(id)
      if (key in defConfig) {
        const type = target.type
        const value = type === 'checkbox'
          ? target.checked
          : target.value
        setStorageData({
          [key]: value
        })
      }
    }
  })
})()
