import type { IInjectedWebData } from '../../types'

interface IAdsPopup extends HTMLElement {
  close: () => void
}

(async () => {
  const srcScript = document.querySelector('#baha-auto-sign')
  if (!window.Signin || !srcScript)
    return

  // Parse the injected data.
  const data = JSON.parse(srcScript.getAttribute('data-bas') ?? '{}') as IInjectedWebData

  // Dispatch a complete event on the source tag.
  const dispatchSignCompleteEvent = () => {
    srcScript.dispatchEvent(new CustomEvent('bas-sign-complete'))
  }

  // Override the Dialogify module behavior.
  const dConfirm = window.Dialogify.confirm
  window.Dialogify.confirm = (message: string, options: any) => {
    // Bypass the watch AD confirmation dialog.
    if (message !== '是否觀看廣告？')
      dConfirm.call(window.Dialogify, message, options)
  }
  const dAlert = window.Dialogify.alert
  window.Dialogify.alert = (message: string) => {
    // Monitor the AD watch status.
    if (message.includes('觀看廣告完成'))
      dispatchSignCompleteEvent()
    dAlert.call(window.Dialogify, message)
  }

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
    } catch (_e) {
      // Do nothing.
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
      }, 1300)
    }
  }

  // Remove the AD loading failed dialog.
  window.SigninAd.loadingFail = () => {}

  // Define the action after sign in is completed.
  const onSignComplete = (getAdReward = true) => {
    clearTimeout(timer)
    if (getAdReward && data.autoDouble) {
      // Make sure the ad module has been initialized.
      try {
        window.SigninAd.initAd()
      } catch (_e) {
        // Exception will be thrown if ADBlock is enabled.
      } finally {
        setTimeout(() => {
          // `startAd` will call `videoByReward`.
          window.SigninAd.startAd()
        }, 1000)
      }
    } else
      dispatchSignCompleteEvent()
  }

  // Auto sign will not be triggered when current time is earlier than 00:06.
  // If it's not triggered in 3 seconds, do it manually.
  const timer = setTimeout(async () => {
    const status = await window.Signin.checkSigninStatus()
    if (status.data.signin === 1)
      onSignComplete(status.data.finishedAd === 0)
    else
      window.Signin.mobile()
  }, 3000)

  const isVisitor = !document.cookie.includes('BAHAID=')
  // Do nothing if use is not logged in.
  if (isVisitor) {
    clearTimeout(timer)

    if (data.autoLogin && window.User?.Login?.requireLoginIframe)
      window.User.Login.requireLoginIframe()
  }
})()
