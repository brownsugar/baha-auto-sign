declare global {
  interface Window {
    User: {
      Login: {
        requireLoginIframe: (callback?: any, title?: string) => void
      }
    }
    Signin: {
      mobile: () => void
      signinWork: () => Promise<any>
      finishAd: (() => void) | undefined
      checkSigninStatus: () => Promise<{
        data: {
          days: number
          signin: 0 | 1
          finishedAd: 0 | 1
          prjSigninDays: number
          btnMessage: string
          totalWeeks: number
        }
      }>
    }
    SigninAd: {
      Player: {
        videoByReward: () => void
      }
      initAd: () => void
      startAd: () => void
      setFinishAd: () => void
      finishAd: () => void
      loadingFail: () => void
    }
    Dialogify: {
      confirm: (message: string, options: any) => void
      alert: (message: string) => void
    }
  }
}

export interface IInjectedWebData {
  runtimeId: string
  autoDouble: boolean
  autoLogin: boolean
}
