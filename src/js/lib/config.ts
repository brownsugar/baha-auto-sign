import { getStorageData, setStorageData, removeStorageData } from './storage'

export const configLocalPrefix = 'local-'

export interface IConfig {
  autoLaunch: boolean
  launchTime: string
  autoDouble: boolean
  clientId: string | null
  // Deprecated since v1.0
  autoOpen?: boolean
  hour?: number
  min?: number
}
export interface IConfigLocal {
  autoLogin: boolean
  loginUsername: string
  loginPassword: string
  disableFunction: boolean
}

export const defConfig: IConfig = {
  autoLaunch: true,
  launchTime: '00:06',
  autoDouble: true,
  clientId: null,
}
export const defConfigLocal: IConfigLocal = {
  autoLogin: false,
  loginUsername: '',
  loginPassword: '',
  disableFunction: false,
}

export const getConfig = async () => {
  const config = await getStorageData(defConfig)
  await migrateConfig(config)
  return config
}
export const getConfigLocal = async () => {
  const config = await getStorageData(defConfigLocal, true)
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
      'min',
    ])
    await setStorageData(config)
  }
}
