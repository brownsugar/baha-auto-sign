import { getConfig } from './lib/config'

// Handle messages
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log(request, sender)
//   const { action } = request
//   switch (action) {
//     case 'sign-complete':
//       break
//   }
// })

// Handle config changes
const configHandler = {
  autoLaunchChanged: (val: boolean, oldVal: boolean) => {
    if (val) {
      createLaunchAlarm()
    } else {
      removeLaunchAlarm()
    }
  },
  launchTimeChanged: (val: string, oldVal: string) => {
    createLaunchAlarm()
  }
}
chrome.storage.onChanged.addListener((changes) => {
  for (const key in changes) {
    const eventName = key + 'Changed'
    if (eventName in configHandler) {
      const field = changes[key]
      configHandler[eventName](field.newValue, field.oldValue)
    }
  }
})

// Handle auto launch
const ALARM_LAUNCH = 'launch'
const createLaunchAlarm = async () => {
  const config = await getConfig()

  if (!config.autoLaunch) {
    return
  }

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
    when: targetTime
  })
}
const removeLaunchAlarm = () => {
  chrome.alarms.clear(ALARM_LAUNCH)
}
const launchBaha = async () => {
  const url = 'https://home.gamer.com.tw/homeindex.php'
  const windows = await chrome.windows.getAll()
  if (windows.length > 0) {
    chrome.tabs.create({
      url,
      active: false
    })
  } else {
    chrome.windows.create({
      url,
      focused: false
    })
  }
}
createLaunchAlarm()
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_LAUNCH) {
    launchBaha()
    createLaunchAlarm()
  }
})
