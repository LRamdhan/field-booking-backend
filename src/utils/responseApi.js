const responseApi = {
  success: (res, data, statusCode = 200, message = 'Success') => {
    res.statusCode = statusCode
    res.json({success: true, message, data})
  },

  error: (res, message, statusCode = 400) => {
    res.statusCode = statusCode
    res.json({success: false, message, data: {}})
  },

  badRequest: (res, message) => {
    res.statusCode = 400
    res.json({
      success: false,
      message, 
      data: {}
    })
  },

  html: (res, html, statusCode = 400) => {
    res.statusCode = statusCode
    res.header('Content-Type', 'text/html')
    res.send(html)
  },

  serverError: (res, err) => {
    res.statusCode = 500
    res.json({
      success: false,
      message: err.message,
      data: {}
    })
  }
}
export default responseApi