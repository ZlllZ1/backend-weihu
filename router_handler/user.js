const User = require('../mongodb/user.js')
const bcrypt = require('bcrypt')
const OssClient = require('../utils/ossClient.js')
const fs = require('fs')
const path = require('path')

const getUserInfo = async (req, res) => {
	const { account } = req.query
	if (!account) return res.sendError(400, 'account is required')
	try {
		const user = await User.findOne({ email: account }).populate('setting').lean()
		if (!user) return res.sendError(404, 'User not found')
		if (!user.setting) {
			user.setting = {
				showIp: true,
				showFan: true,
				showFollow: true,
				showFriend: true,
				showPraise: true,
				showLive: true,
				showCollect: true,
				showShare: true,
				chatLimit: 0,
				circleLimit: 0,
				postLimit: 0
			}
		}
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
		res.sendError(500, 'Internal server error')
	}
}

const changeLive = async (req, res) => {
	const { account, live } = req.body
	if (!account || !live) return res.sendError(400, 'account or live is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		user.live = live
		await user.save()
		res.sendSuccess({ message: 'Live changed successfully' })
	} catch (error) {
		console.error('Error in changeLive:', error)
		res.sendError(500, 'Internal server error')
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
		res.sendError(500, 'Internal server error')
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
		res.sendError(500, 'Internal server error')
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
		res.sendError(500, 'Internal server error')
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
		res.sendError(500, 'Internal server error')
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
		res.sendError(500, 'Internal server error')
	}
}

const changeAvatar = async (req, res) => {
	const { account } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `avatar/${user._id}${fileExt}`
		if (user.avatar) {
			const oldAvatarKey = user.avatar.split('/').pop()
			try {
				await OssClient.deleteFile(`avatars/${oldAvatarKey}`)
			} catch (error) {
				console.error('Error in deleteFile:', error)
			}
		}
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		user.avatar = result.url
		await user.save()
		fs.unlinkSync(req.file.path)
		res.sendSuccess({ message: 'Avatar changed successfully', avatarUrl: result.url })
	} catch (error) {
		console.error('Error in changeAvatar:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeHomeBg = async (req, res) => {
	const { account } = req.body
	if (!account || !req.file)
		return res.sendError(400, 'account and home background file are required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `homeBg/${user._id}${fileExt}`
		if (user.homeBg) {
			const oldHomeBgKey = user.homeBg.split('/').pop()
			try {
				await OssClient.deleteFile(`home-backgrounds/${oldHomeBgKey}`)
			} catch (error) {
				console.error('Error in deleteFile:', error)
			}
		}
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		user.homeBg = result.url
		await user.save()
		fs.unlinkSync(req.file.path)
		res.sendSuccess({ message: 'Home background changed successfully', homeBgUrl: result.url })
	} catch (error) {
		console.error('Error in changeHomeBg:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeCircleBg = async (req, res) => {
	const { account } = req.body
	if (!account || !req.file)
		return res.sendError(400, 'account and circle background file are required')
	try {
		const user = await User.findOne({ email: account })
		if (!user) return res.sendError(404, 'User not found')
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `circleBg/${user._id}${fileExt}`
		if (user.circleBg) {
			const oldCircleBgKey = user.circleBg.split('/').pop()
			try {
				await OssClient.deleteFile(`circle-backgrounds/${oldCircleBgKey}`)
			} catch (error) {
				console.error('Error in deleteFile:', error)
			}
		}
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		user.circleBg = result.url
		await user.save()
		fs.unlinkSync(req.file.path)
		res.sendSuccess({ message: 'Circle background changed successfully', circleBgUrl: result.url })
	} catch (error) {
		console.error('Error in changeCircleBg:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	getUserInfo,
	changeNickname,
	changeSex,
	changeEmail,
	changePassword,
	changeIntroduction,
	changeBirthDate,
	changeAvatar,
	changeHomeBg,
	changeCircleBg,
	changeLive
}
