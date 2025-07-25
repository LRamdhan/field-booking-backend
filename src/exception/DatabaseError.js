class DatabaseError extends Error {
  constructor(message, responseCode = 400, responseType = 'json', html, body) {
    super(message);
    this.responseCode = responseCode
    this.name = 'DatabaseError';
    this.responseType = responseType
    this.html = html
    this.body = body
  }
}

export default DatabaseError