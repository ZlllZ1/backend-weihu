const User = require('../mongodb/user.js')

const getUserInfo = async (req, res) => {
	const { account } = req.query
	if (!account) return res.sendError(400, 'account is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		res.sendSuccess(user)
	} catch (error) {
		console.error('Error in getUserInfo:', error)
		res.sendError(500, 'Internal server error')
	}
}

const logout = async (req, res) => {
	const { account } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.token = null
		await user.save()
		res.sendSuccess({ message: 'Logout successful' })
	} catch (error) {
		console.error('Error in logout:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	getUserInfo,
	logout
}
