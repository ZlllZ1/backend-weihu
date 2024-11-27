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

const codeLogin = async (req, res) => {
	const { account, authCode, type = '' } = req.body
	if (!account || !authCode) return res.sendError(400, 'account or authCode is required')
	try {
		const existingUser = await User.findOne({ email: account })
		const authCodeDoc = await AuthCode.findOne({ email: account })
		if (!authCodeDoc || authCode !== authCodeDoc.code || Date.now() > authCodeDoc.expires)
			return res.sendError(400, 'Invalid or expired auth code')
		let user
		let token
		if (existingUser) {
			user = existingUser
			user.lastLoginDate = new Date().toISOString().split('T')[0]
		} else {
			user = new User({
				email: account,
				password: bcrypt.hashSync(authCode, 10),
				nickname: account,
				sex: 2,
				birthDate: new Date().toISOString().split('T')[0],
				registrationDate: new Date().toISOString().split('T')[0],
				lastLoginDate: new Date().toISOString().split('T')[0]
			})
			token = generateToken(user)
			await user.save()
		}
		user.lastLoginDate = new Date()
		if (type !== 'auth') {
			user.token = token
		}
		token = generateToken(user)
		await user.save()
		await AuthCode.deleteMany({ email: account })
		return res.sendSuccess({ token }, 'Login/Register success')
	} catch (error) {
		console.error(error)
		return res.sendError(500, 'Server error')
	}
}

const passwordLogin = async (req, res) => {
	const { account, password } = req.body
	if (!account || !password) return res.sendError(400, 'account or password is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(400, 'Invalid account')
		const isValid = bcrypt.compareSync(password, user.password)
		if (!isValid) return res.sendError(400, 'Invalid password')
		const token = generateToken(user)
		return res.ApiResponse.success({ token }, 'Login success')
	} catch (error) {
		return res.sendError(500, 'An error occurred during login')
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
	sendAuthCode,
	codeLogin,
	passwordLogin,
	logout
}
