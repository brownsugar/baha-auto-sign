import { pageView, event } from './lib/ga'
import { getConfig, getConfigLocal } from './lib/config'

pageView()

// Handle messages
let lastTabId: number | undefined
const onSignComplete = async () => {
  const config = await getConfig()
  if (config.autoDestroy && lastTabId !== undefined) {
    chrome.tabs.remove(lastTabId)
    lastTabId = undefined
  }
}
chrome.runtime.onMessage.addListener((request, sender, _sendResponse) => {
  const { action } = request
  switch (action) {
    case 'page-load': {
      const origin = sender.tab?.url
      if (origin !== undefined) {
        const url = new URL(origin)
        event('view', 'hostname', url.hostname)
      }
      break
    }
    case 'sign-complete': {
      onSignComplete()
      break
    }
  }
})

// Handle config changes
const configHandler = {
  autoLaunchChanged: (val: boolean) => {
    if (val)
      createLaunchAlarm()
    else
      removeLaunchAlarm()
  },
  launchTimeChanged: () => {
    createLaunchAlarm()
  },
  disableFunctionChanged: (val: boolean) => {
    if (val)
      removeLaunchAlarm()
    else
      createLaunchAlarm()
  },
}
chrome.storage.onChanged.addListener((changes, areaName) => {
  for (const key in changes) {
    const eventName = key + 'Changed'
    if (eventName in configHandler) {
      const field = changes[key]
      configHandler[eventName](field.newValue, field.oldValue, areaName)
    }
  }
})

// Handle auto launch
const ALARM_LAUNCH = 'launch'
const createLaunchAlarm = async () => {
  const configLocal = await getConfigLocal()
  const config = await getConfig()

  if (configLocal.disableFunction || !config.autoLaunch || config.launchTime === '')
    return

  const [hour, minute] = config.launchTime.split(':')
    .map(string => Number(string))
  let targetTime = (new Date()).setHours(hour, minute, 0, 0)
  if (targetTime < Date.now()) {
    // If target time is earlier than current time, set the time to tomorrow.
    const date = new Date(targetTime)
    targetTime = date.setDate(date.getDate() + 1)
  }

  removeLaunchAlarm()
  chrome.alarms.create(ALARM_LAUNCH, {
    when: targetTime,
  })
}
const removeLaunchAlarm = () => {
  chrome.alarms.clear(ALARM_LAUNCH)
}
const launchBaha = async () => {
  const config = await getConfig()
  event('sign', 'time', config.launchTime)
  event('sign', 'double', Number(config.autoDouble))
  event('sign', 'destroy', Number(config.autoDestroy))

  const url = 'https://home.gamer.com.tw/homeindex.php'
  const windows = await chrome.windows.getAll()
  if (windows.length > 0) {
    const tab = await chrome.tabs.create({
      url,
      active: false,
    })
    lastTabId = tab.id
  } else {
    const window = await chrome.windows.create({
      url,
      focused: false,
    })
    lastTabId = window.tabs?.[0].id
  }
}
createLaunchAlarm()
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_LAUNCH) {
    launchBaha()
    createLaunchAlarm()
  }
})
