import { getConfig } from './lib/config'

interface IInjectedData {
  runtimeId: string
  autoDouble: boolean
}
interface IAdsPopup extends HTMLElement {
  close: () => void
}

const inject = () => {
  if (window.Signin === undefined) {
    return
  }

  const data: IInjectedData = JSON.parse('INJECTED_DATA')

  // Override the default sign in behavior.
  const signinWork = window.Signin.signinWork
  window.Signin.signinWork = async () => {
    const response = await signinWork.call(window.Signin)
    onSignComplete()
    return response
  }

  // Override the video AD behavior.
  const videoByReward = window.SigninAd.Player.videoByReward
  window.SigninAd.Player.videoByReward = () => {
    try {
      videoByReward.call(window.SigninAd.Player)
    } catch (e) {
    } finally {
      // Close `廣告載入中` dialog manually as user who enabled ADBlock will cause the dialog stuck.
      const popup = document.querySelector('.dialogify__adsPopup') as IAdsPopup
      popup?.close()
      // Delay call the finish function.
      setTimeout(() => {
        // Fix calling undefined function from `setFinishAd`.
        if (typeof window.Signin.finishAd === 'undefined') {
          window.Signin.finishAd = () => {
            window.SigninAd.finishAd()
          }
        }
        window.SigninAd.setFinishAd()
      }, 1000)
    }
  }

  // Remove the AD loading failed dialog.
  window.SigninAd.loadingFail = () => {}

  // Override the Dialogify module behavior.
  const confirm = window.Dialogify.confirm
  window.Dialogify.confirm = (message: string, options: any) => {
    // Intercept the AD confirm dialog, we don't need this.
    if (message !== '是否觀看廣告？') {
      confirm.call(window.Dialogify, message, options)
    }
  }

  // Define the action after sign in is completed.
  const onSignComplete = (getAdReward = true) => {
    clearTimeout(timer)
    if (getAdReward && data.autoDouble) {
      // Make sure the ad module has been initialized.
      try {
        window.SigninAd.initAd()
      } catch (e) {
        // Exception will be thrown if ADBlock is enabled.
      } finally {
        // `startAd` will call `videoByReward`.
        window.SigninAd.startAd()
      }
    }
  }

  // Auto sign will not be triggered when current time is earlier than 00:06.
  // If it's not triggered in 3 seconds, do it manually.
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const timer = setTimeout(async () => {
    const status = await window.Signin.checkSigninStatus()
    if (status.data.signin === 1) {
      onSignComplete(status.data.finishedAd === 0)
    } else {
      window.Signin.mobile()
    }
  }, 3000)
}

(async () => {
  const config = await getConfig()
  const data = {
    runtimeId: chrome.runtime.id,
    autoDouble: config.autoDouble
  }
  const script = inject.toString()
    .replace('INJECTED_DATA', JSON.stringify(data))

  // Use inline execution instead of inserting inline scripts due to CSP limitation.
  const button = document.createElement('button')
  button.id = 'baha-auto-sign'
  button.style.display = 'none'
  button.setAttribute('onclick', `(${script})()`)
  document.body.appendChild(button)
  button.click()
})()
