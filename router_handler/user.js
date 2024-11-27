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

const changeNickname = async (req, res) => {
	const { account, nickname } = req.body
	if (!account || !nickname) return res.sendError(400, 'account or nickname is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.nickname = nickname
		await user.save()
		res.sendSuccess({ message: 'Nickname changed successfully' })
	} catch (error) {
		console.error('Error in changeNickname:', error)
	}
}

const changeSex = async (req, res) => {
	const { account, sex } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.sex = sex
		await user.save()
		res.sendSuccess({ message: 'Sex changed successfully' })
	} catch (error) {
		console.error('Error in changeSex:', error)
	}
}

const changeEmail = async (req, res) => {
	const { account, email } = req.body
	if (!account || !email) return res.sendError(400, 'account or email is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.email = email
		await user.save()
		res.sendSuccess({ message: 'Email changed successfully' })
	} catch (error) {
		console.error('Error in changeEmail:', error)
	}
}

// const logout = async (req, res) => {
// 	const { account } = req.body
// 	if (!account) return res.sendError(400, 'account is required')
// 	try {
// 		const user = await User.findOne({ email: account })
// 		if (!user) return res.sendError(404, 'User not found')
// 		user.token = null
// 		await user.save()
// 		res.sendSuccess({ message: 'Logout successful' })
// 	} catch (error) {
// 		console.error('Error in logout:', error)
// 		res.sendError(500, 'Internal server error')
// 	}
// }

module.exports = {
	getUserInfo,
	// logout,
	changeNickname,
	changeSex,
	changeEmail
}
