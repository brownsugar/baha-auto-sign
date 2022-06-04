import { getStorageData, setStorageData, removeStorageData } from './storage'

export interface IConfig {
  autoLaunch: boolean
  launchTime: string
  autoDouble: boolean
  // Deprecated since v1.0
  autoOpen?: boolean
  hour?: number
  min?: number
}
export const defConfig: IConfig = {
  autoLaunch: true,
  launchTime: '00:05',
  autoDouble: true
}
export const getConfig = async () => {
  const config = await getStorageData(defConfig)
  migrateConfig(config)
  return config
}

const migrateConfig = async (config: IConfig) => {
  // Migrate from v0.x to v1.x
  if (config.autoOpen !== undefined) {
    config.autoLaunch = config.autoOpen
    config.launchTime = String(config.hour).padStart(2, '0') + ':' + String(config.min).padStart(2, '0')
    delete config.autoOpen
    delete config.hour
    delete config.min
    await removeStorageData([
      'autoOpen',
      'hour',
      'min'
    ])
    await setStorageData(config)
  }
}