const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const verifyToken = (req, res, next) => {
	const token = req.headers['authorization']?.split(' ')[1]
	if (!token) return res.sendError('Unauthorized')
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		req.userId = new mongoose.Types.ObjectId(decoded._id)
		next()
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) return res.sendError('Token expired')
		return res.sendError('Invalid token')
	}
}

module.exports = verifyToken
