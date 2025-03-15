const getDeviceInfo = req => {
  const info = {
    browser: req.useragent.browser,
    os: req.useragent.os,
    platform: req.useragent.platform,
  }

  switch(true) {
    case req.useragent.isTablet :
      info.device = 'Tablet'
      break
    case req.useragent.isiPad :
      info.device = 'IPad'
      break
    case req.useragent.isiPod :
      info.device = 'IPod'
      break
    case req.useragent.isiPhone :
      info.device = 'Phone'
      break
    case req.useragent.isiPhoneNative :
      info.device = 'PhoneNative'
      break
    case req.useragent.isAndroid :
      info.device = 'Android'
      break
    case req.useragent.isAndroidNative :
      info.device = 'AndroidNative'
      break
    case req.useragent.isBlackberry :
      info.device = 'Blackberry'
      break
    case req.useragent.isDesktop :
      info.device = 'Desktop'
      break
  }

  return info
}

export { getDeviceInfo }