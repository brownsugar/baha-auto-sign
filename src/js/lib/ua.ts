import { measure } from 'measurement-protocol'

const tracker = measure('UA-17631526-15')
tracker.pageview(location.origin + '/background').send()

const event = async (category, action, label) =>
  await tracker.event(category, action, label).send()

event('extension', 'language', chrome.i18n.getUILanguage())

export { tracker, event }
