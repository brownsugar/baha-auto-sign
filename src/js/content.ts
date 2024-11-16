import { getConfig, getConfigLocal } from './lib/config'
import type { IInjectedData } from '../../types'

const injectScript = (path: string, attributes: Record<string, any>) => {
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.id = 'baha-auto-sign'
    script.onload = resolve
    for (const key in attributes)
      script.setAttribute(`data-${key}`, String(attributes[key]))
    document.body.appendChild(script)
    script.src = chrome.runtime.getURL(path)
  })
}

(async () => {
  const configLocal = await getConfigLocal()
  if (configLocal.disableFunction)
    return

  const config = await getConfig()
  const data: IInjectedData = {
    runtimeId: chrome.runtime.id,
    autoDouble: config.autoDouble,
    autoLogin: configLocal.autoLogin,
  }
  await injectScript('/js/webContent.js', data)

  chrome.runtime.sendMessage({
    action: 'page-load',
  })
})()
