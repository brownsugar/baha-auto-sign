// [WIP] Auto login
// {
//   "run_at": "document_end",
//   "matches": [ "https:\/\/user.gamer.com.tw/login.php" ],
//   "js": [ "js/login.js" ],
//   "all_frames": true
// }
(() => {
  // const config = await getConfig();

  // Fill in login info
  // ...

  // Check auto login
  const autologin = document.querySelector('#check-autologin') as HTMLInputElement
  if (autologin !== null) {
    autologin.checked = true
  }
  // Submit the form
  const login = document.querySelector('#btn-login') as HTMLInputElement
  if (login !== null) {
    login.click()
  }
})()
