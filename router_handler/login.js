const AuthCode = require('../mongodb/authCode.js')
const User = require('../mongodb/user.js')
const sendEmail = require('../utils/sendEmail.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const generateToken = user => {
	return jwt.sign(
		{
			id: user._id.toString(),
			email: user.email
		},
		process.env.JWT_SECRET,
		{ expiresIn: '1d' }
	)
}

const EMAIL_PROVIDERS = {
	QQ: '@qq.com',
	NETEASE: '@163.com'
}
const SENDER_EMAILS = {
	[EMAIL_PROVIDERS.QQ]: '2060909362@qq.com',
	[EMAIL_PROVIDERS.NETEASE]: '15292021323@163.com'
}
const generateEmailCode = () => {
	return Array(6)
		.fill(0)
		.map(() => Math.floor(Math.random() * 10))
		.join('')
}
const createEmailContent = (account, emailCode, providerName) => {
	const title = `微乎---${providerName}邮箱验证码`
	const body = `
    <p><strong>您好：</strong></p>
    <p style="font-size: 16px;color:#000;">
			您正在进行微乎账号登录操作,请使用下方6位验证码,验证身份并完成注册/登录:
    </p>
		<p style="font-size: 28px;color:#1172F6;margin: 20px 0 0 20px;text-align: center;"> ${emailCode}</p>
    <p>验证码告知他人将会导致数据信息被盗，请勿泄露</p>
    <p style="font-size: 12px;color:#999;">过期时间 ${new Date(Date.now() + 60 * 1000 * 3)}</p>
  `
	return {
		from: SENDER_EMAILS[providerName],
		to: account,
		subject: title,
		html: body
	}
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
		if (providerName === 'QQ') sendEmail.sendQQ(emailContent)
		else if (providerName === 'NETEASE') sendEmail.send163(emailContent)
		const authCode = new AuthCode({
			email: account,
			code: emailCode,
			expires: Date.now() + 60 * 1000 * 3
		})
		await AuthCode.deleteMany({ email: account })
		await authCode.save()
		res.sendSuccess('Verification code sent successfully')
	} catch {
		console.error('Error in sendAuthCode:', error)
		res.sendError(500, 'Internal server error')
	}
}

const codeLogin = async (req, res) => {
	const { account, authCode } = req.body
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
		} else {
			token = generateToken(user)
			user = new User({
				email: account,
				password: bcrypt.hashSync(authCode, 10),
				token: token
			})
			await user.save()
		}
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

module.exports = {
	sendAuthCode,
	codeLogin,
	passwordLogin
}
