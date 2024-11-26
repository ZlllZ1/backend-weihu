const ApiResponse = require('../utils/response.js')

const apiResponseMiddleware = (req, res, next) => {
	res.sendSuccess = (data = null, message = 'Success') => {
		res.status(200).json(ApiResponse.success(data, message))
	}

	res.sendError = (code = 400, message = 'Error', data = null) => {
		res.status(code).json(ApiResponse.error(code, message, data))
	}

	next()
}

module.exports = apiResponseMiddleware
