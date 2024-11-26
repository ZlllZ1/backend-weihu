const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
	const token = req.headers['authorization']?.split('')[1]
	if (!token) {
		return res.ApiResponse.error(401, 'Unauthorized')
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		req.userId = new mongoose.Types.ObjectId(decoded._id)
		next()
	} catch (err) {
		if (error instanceof jwt.TokenExpiredError) return res.ApiResponse.error(401, 'Token expired')
		return res.ApiResponse.error(401, 'Invalid token')
	}
}

module.exports = verifyToken
