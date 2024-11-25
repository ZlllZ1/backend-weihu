class ApiResponse {
	constructor(code, message, data = null) {
		this.code = code
		this.message = message
		this.data = data
	}

	static success(data = null) {
		return new ApiResponse(200, 'Success', data)
	}

	static error(code, message, data = null) {
		return new ApiResponse(code, message, data)
	}

	toJSON() {
		return JSON.stringify(this)
	}
}

module.exports = ApiResponse
