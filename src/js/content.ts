import { getConfig, getConfigLocal } from './lib/config'
import type { IInjectedWebData } from '../../types'

const injectScript = (path: string, attributes: Record<string, any>) => {
  return new Promise<HTMLScriptElement>(resolve => {
    const script = document.createElement('script')
    script.id = 'baha-auto-sign'
    script.onload = () => resolve(script)
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
  const data: IInjectedWebData = {
    runtimeId: chrome.runtime.id,
    autoDouble: config.autoDouble,
    autoLogin: configLocal.autoLogin,
  }
  const tag = await injectScript('/js/webContent.js', {
    bas: JSON.stringify(data),
  })
  tag.addEventListener('bas-sign-complete', () => {
    chrome.runtime.sendMessage({
      action: 'sign-complete',
    })
  })

  chrome.runtime.sendMessage({
    action: 'page-load',
  })
})()
