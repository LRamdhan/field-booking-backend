class ValidationError extends Error {
  constructor(message, responseType = 'json', html) {
    super(message);
    this.name = 'ValidationError';
    this.responseType = responseType
    this.html = html
  }
}

export default ValidationError