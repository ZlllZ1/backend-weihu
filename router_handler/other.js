const ErrorLog = require('../mongodb/errorLog.js')
const User = require('../mongodb/user.js')
const bcrypt = require('bcrypt')

const commitErrorLog = async (req, res) => {
	const { errorContent } = req.body
	if (!errorContent) return res.sendError(400, 'errorContent is required')
	try {
		const errorLog = new ErrorLog({ errorContent, createTime: new Date() })
		await errorLog.save()
		res.sendSuccess({ message: 'ErrorLog committed successfully' })
	} catch (error) {
		console.error('Error in commitErrorLog:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changePassword = async (req, res) => {
	const { account, password } = req.body
	console.log(account, password)
	if (!account || !password) return res.sendError(400, 'account or password is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		const hashedPassword = await bcrypt.hash(password, 10)
		user.password = hashedPassword
		await user.save()
		res.sendSuccess({ message: 'Password changed successfully' })
	} catch (error) {
		console.error('Error in changePassword:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	commitErrorLog,
	changePassword
}
