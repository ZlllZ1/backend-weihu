const AuthCode = require('../mongodb/authCode.js')
const User = require('../mongodb/user.js')
const {
	EMAIL_PROVIDERS,
	generateEmailCode,
	createEmailContent,
	send163,
	sendQQ
} = require('../utils/sendEmail.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const generateToken = user => {
	return jwt.sign(
		{
			id: user._id.toString(),
			email: user.email
		},
		process.env.JWT_SECRET,
		{ expiresIn: '3h' }
	)
}

const sendAuthCode = async (req, res) => {
	try {
		const { account } = req.body
		if (!account) return res.sendError(400, 'account is required')
		const emailProvider = Object.entries(EMAIL_PROVIDERS).find(([_, domain]) =>
			account.includes(domain)
		)
		if (!emailProvider) return res.sendError(400, 'Unsupported email provider')
		const [providerName, providerDomain] = emailProvider
		const emailCode = generateEmailCode()
		const emailContent = createEmailContent(account, emailCode, providerDomain)
		if (providerName === 'QQ') sendQQ(emailContent)
		else if (providerName === 'NETEASE') send163(emailContent)
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
	const { account, authCode } = req.body
	if (!account || !authCode) return res.sendError(400, 'account or authCode is required')
	try {
		const [existingUser, authCodeDoc] = await Promise.all([
			User.findOne({ email: account }),
			AuthCode.findOne({ email: account })
		])
		if (!authCodeDoc || authCode !== authCodeDoc.code || Date.now() > authCodeDoc.expires)
			return res.sendError(400, 'Invalid or expired auth code')
		const user =
			existingUser ||
			new User({
				email: account,
				password: bcrypt.hashSync(authCode, 10),
				nickname: account,
				sex: 2,
				birthDate: new Date().toISOString().split('T')[0],
				registrationDate: new Date()
			})
		user.lastLoginDate = new Date()
		user.token = generateToken(user)
		await Promise.all([user.save(), AuthCode.deleteMany({ email: account })])
		return res.sendSuccess({ token: user.token }, 'Register/Login success')
	} catch (error) {
		console.error(error)
		return res.sendError(500, 'Server error')
	}
}

const passwordLogin = async (req, res) => {
	try {
		const { account, password } = req.body
		if (!account || !password) return res.sendError(400, 'account or password is required')
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(400, 'Invalid account')
		const isValid = await bcrypt.compareSync(password, user.password)
		if (!isValid) return res.sendError(400, 'Invalid password')
		const token = generateToken(user)
		user.token = token
		user.lastLoginDate = new Date()
		await user.save()
		return res.sendSuccess({ token: user.token }, 'Login success')
	} catch (error) {
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
	logout
}
