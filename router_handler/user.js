const User = require('../mongodb/user.js')
const bcrypt = require('bcrypt')

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

const changePassword = async (req, res) => {
	const { account, password } = req.body
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
	}
}

const changeIntroduction = async (req, res) => {
	const { account, introduction } = req.body
	if (!account || !introduction) return res.sendError(400, 'account or introduction is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.introduction = introduction
		await user.save()
		res.sendSuccess({ message: 'Introduction changed successfully' })
	} catch (error) {
		console.error('Error in changeIntroduction:', error)
	}
}

const changeBirthDate = async (req, res) => {
	const { account, birthDate } = req.body
	if (!account || !birthDate) return res.sendError(400, 'account or birthDate is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.birthDate = birthDate
		user.age = new Date().getFullYear() - new Date(birthDate).getFullYear()
		await user.save()
		res.sendSuccess({ message: 'BirthDate changed successfully' })
	} catch (error) {
		console.error('Error in changeBirthDate:', error)
	}
}

module.exports = {
	getUserInfo,
	changeNickname,
	changeSex,
	changeEmail,
	changePassword,
	changeIntroduction,
	changeBirthDate
}
