import MeasurementProtocol from '@os-team/measurement-protocol'
import type { Event } from '@os-team/measurement-protocol'
import { getConfig } from './config'
import { setStorageData } from './storage'

const getClientId = async () => {
  const { clientId } = await getConfig()
  if (clientId)
    return clientId
  const newClientId = crypto.randomUUID()
  await setStorageData({
    clientId: newClientId,
  })
  return newClientId
}

const tracker = new MeasurementProtocol({
  measurementId: 'G-NX79VZYHXW',
  apiSecret: 'rmdsr5hJRziNCWcQbrvTuw',
})

const sendEvents = async (events: Event[]) =>
  await tracker.send({
    client_id: await getClientId(),
    non_personalized_ads: true,
    events,
  })

const pageView = async () =>
  await sendEvents([
    {
      name: 'page_view',
      params: {
        page_location: location.origin + '/background',
      },
    },
  ])

const event = async (category, action, label) =>
  await sendEvents([
    {
      name: category,
      params: {
        [action]: label,
      },
    },
  ])

event('extension', 'language', chrome.i18n.getUILanguage())

export { tracker, pageView, event }
