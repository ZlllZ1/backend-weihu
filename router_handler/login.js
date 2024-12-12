const AuthCode = require('../mongodb/authCode.js')
const Setting = require('../mongodb/setting.js')
const User = require('../mongodb/user.js')

const { generateEmailCode, createEmailContent, send163 } = require('../utils/sendEmail.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const generateToken = user => {
	return jwt.sign(
		{
			id: user._id.toString(),
			email: user.email
		},
		process.env.JWT_SECRET,
		{ expiresIn: '1h' }
	)
}

const generateRefreshToken = user => {
	return jwt.sign(
		{
			id: user._id.toString(),
			email: user.email
		},
		process.env.JWT_SECRET,
		{ expiresIn: '1d' }
	)
}

const sendAuthCode = async (req, res) => {
	try {
		const { account } = req.body
		if (!account) return res.sendError(400, 'account is required')
		const emailCode = generateEmailCode()
		const emailContent = createEmailContent(account, emailCode)
		const senderEmail = '15292021323@163.com'
		await send163(emailContent, senderEmail)
		const authCode = new AuthCode({
			email: account,
			code: emailCode,
			expires: Date.now() + 60 * 1000 * 3
		})
		await AuthCode.deleteMany({ email: account })
		await authCode.save()
		res.sendSuccess('Verification code sent successfully')
	} catch (error) {
		console.error('Error in sendAuthCode:', error)
		res.sendError(500, 'Internal server error')
	}
}

const judgeAuthCode = async (req, res) => {
	try {
		const { account, authCode } = req.body
		if (!account || !authCode) return res.sendError(400, 'account or authCode is required')
		const authCodeDoc = await AuthCode.findOne({ email: account })
		if (!authCodeDoc || authCode !== authCodeDoc.code || Date.now() > authCodeDoc.expires)
			return res.sendError(400, 'Expired authCode')
		if (authCode !== authCodeDoc.code) return res.sendError(400, 'Invalid authCode')
		await AuthCode.deleteMany({ email: account })
		return res.sendSuccess('Correct authCode')
	} catch (error) {
		console.error('Error in authCode:', error)
	}
}

const codeLogin = async (req, res) => {
	try {
		const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const { account, authCode } = req.body
		if (!account || !authCode) return res.sendError(400, 'account or authCode is required')
		const [existingUser, authCodeDoc] = await Promise.all([
			User.findOne({ email: account }),
			AuthCode.findOne({ email: account })
		])
		if (!authCodeDoc || authCode !== authCodeDoc.code || Date.now() > authCodeDoc.expires)
			return res.sendError(400, 'Invalid or expired auth code')
		const setting = await Setting.findOneAndUpdate(
			{ email: account },
			{ email: account },
			{ upsert: true, new: true }
		)
		const user =
			existingUser ||
			new User({
				email: account,
				password: bcrypt.hashSync(authCode, 10),
				nickname: account,
				sex: 2,
				birthDate: new Date().toISOString().split('T')[0],
				registrationDate: new Date(),
				age:
					new Date().getFullYear() - new Date(new Date().toISOString().split('T')[0]).getFullYear(),
				setting: setting._id
			})
		user.lastLoginDate = new Date()
		user.ipAddress = ipAddress
		const token = generateToken(user)
		const refreshToken = generateRefreshToken(user)
		user.refreshToken = refreshToken
		await Promise.all([user.save(), setting.save(), AuthCode.deleteMany({ email: account })])
		return res.sendSuccess({ token, refreshToken }, 'Register/Login success')
	} catch (error) {
		console.error(error)
		return res.sendError(500, 'Server error')
	}
}

const passwordLogin = async (req, res) => {
	const { account, password } = req.body
	if (!account || !password) return res.sendError(400, 'account or password is required')
	try {
		const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(400, 'Invalid account')
		const isValid = await bcrypt.compareSync(password, user.password)
		if (!isValid) return res.sendError(400, 'Invalid password')
		user.lastLoginDate = new Date()
		user.ipAddress = ipAddress
		const token = generateToken(user)
		const refreshToken = generateRefreshToken(user)
		user.refreshToken = refreshToken
		await user.save()
		return res.sendSuccess({ token, refreshToken }, 'Login success')
	} catch (error) {
		return res.sendError(500, 'An error occurred during login')
	}
}

const refreshToken = async (req, res) => {
	const { refreshToken } = req.body
	if (!refreshToken) return res.sendError(400, 'refreshToken is required')
	try {
		jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
			if (err) return res.sendError(401, 'Invalid refresh token')
			const user = await User.findOne({ email: decoded.email })
			if (!user || user.refreshToken !== refreshToken)
				return res.sendError(401, 'User not found or refresh token is invalid')
			const newToken = generateToken(user)
			const newRefreshToken = generateRefreshToken(user)
			user.refreshToken = newRefreshToken
			await user.save()
			return res.sendSuccess(
				{ token: newToken, refreshToken: newRefreshToken },
				'Refresh token success'
			)
		})
	} catch (error) {
		console.error(error)
		return res.sendError(500, 'An error occurred during login')
	}
}

const logout = async (req, res) => {
	const { account } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const result = await User.updateOne({ email: account }, { $set: { token: null } })
		if (result.matchedCount === 0) return res.sendError(404, 'User not found')
		if (result.modifiedCount === 0) return res.sendSuccess({ message: 'User already logged out' })
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.lastLoginDate = new Date()
		user.refreshToken = null
		await user.save()
		return res.sendSuccess({ message: 'Logout successful' })
	} catch (error) {
		console.error('Error in logout:', error)
		return res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	sendAuthCode,
	judgeAuthCode,
	codeLogin,
	passwordLogin,
	logout,
	refreshToken
}
