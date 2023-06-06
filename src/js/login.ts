import { getConfigLocal } from './lib/config'

(() => {
  const doLogin = async () => {
    const configLocal = await getConfigLocal()
    if (!configLocal.autoLogin || !configLocal.loginUsername || !configLocal.loginPassword)
      return

    // Fill in login info
    const username = document.querySelector('#form-login input[name=userid]') as HTMLInputElement
    if (username !== null)
      username.value = configLocal.loginUsername

    const password = document.querySelector('#form-login input[name=password]') as HTMLInputElement
    if (password !== null)
      password.value = configLocal.loginPassword

    // Check auto login
    const autologin = document.querySelector('#check-autologin') as HTMLInputElement
    if (autologin !== null)
      autologin.checked = true

    // Submit the form
    setTimeout(() => {
      const login = document.querySelector('#btn-login') as HTMLInputElement
      if (login !== null)
        login.click()
    })
  }

  window.addEventListener('load', doLogin)
})()
