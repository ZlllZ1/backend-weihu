class ApiResponse {
	constructor(code, message, data = null) {
		this.code = code
		this.message = message
		this.data = data
	}

	static success(data = null, message = 'Success') {
		return new ApiResponse(200, message, data)
	}

	static error(code = 400, message = 'Error', data = null) {
		return new ApiResponse(code, message, data)
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			data: this.data
		}
	}
}

module.exports = ApiResponse
