class OauthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'OauthError'
  }
}

export default OauthError