const SITE_KEY = '6LcOjf0qAAAAANblB_R4x6NncK2qCENFiEJKhRRS'

export async function getRecaptchaToken(action = 'submit') {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.grecaptcha) {
      resolve('')
      return
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(SITE_KEY, { action }).then(resolve)
    })
  })
}

export function loadRecaptchaScript() {
  if (document.querySelector('#recaptcha-script')) return
  const script = document.createElement('script')
  script.id = 'recaptcha-script'
  script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}
