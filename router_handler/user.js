const User = require('../mongodb/user.js')
const bcrypt = require('bcrypt')
const OssClient = require('../utils/ossClient.js')
const fs = require('fs')
const path = require('path')
const { Fan, Friend } = require('../mongodb/fan.js')

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

const followUser = async (req, res) => {
	const { fanEmail, followedEmail } = req.body
	if (!fanEmail || !followedEmail)
		return res.sendError(400, 'fanEmail or followedEmail is required')
	try {
		const [fan, followedUser] = await Promise.all([
			User.findOne({ email: fanEmail }),
			User.findOne({ email: followedEmail })
		])
		if (!fan) return res.sendError(404, 'Fan user not found')
		if (!followedUser) return res.sendError(404, 'Followed user not found')
		const existingFan = await Fan.findOne({ fanEmail, followedEmail })
		let action
		if (existingFan) {
			const deletedFan = await Fan.findOneAndDelete({ fanEmail, followedEmail })
			if (!deletedFan) return res.sendError(409, 'Fan relationship has been modified')
			const isFriend = await Friend.findOne({
				$or: [
					{ email1: fanEmail, email2: followedEmail },
					{ email1: followedEmail, email2: fanEmail }
				]
			})
			let updateFanOp = { $inc: { followNum: -1, version: 1 } }
			let updateFollowedOp = { $inc: { fanNum: -1, version: 1 } }
			if (isFriend) {
				updateFanOp.$inc.friendNum = -1
				updateFollowedOp.$inc.friendNum = -1
			}
			const [updatedFan, updatedFollowed] = await Promise.all([
				User.findOneAndUpdate({ email: fanEmail, version: fan.version }, updateFanOp, {
					new: true
				}),
				User.findOneAndUpdate(
					{ email: followedEmail, version: followedUser.version },
					updateFollowedOp,
					{ new: true }
				)
			])
			if (!updatedFan || !updatedFollowed) {
				if (deletedFan) await Fan.create(deletedFan)
				return res.sendError(409, 'User data has been modified')
			}
			action = 'unFollowed'
			await Friend.deleteOne({
				$or: [
					{ email1: fanEmail, email2: followedEmail },
					{ email1: followedEmail, email2: fanEmail }
				]
			})
		} else {
			const newFan = await Fan.create({ fanEmail, followedEmail, fanDate: Date.now() })
			if (!newFan) return res.sendError(409, 'Fan relationship already exists')
			const [updatedFan, updatedFollowed] = await Promise.all([
				User.findOneAndUpdate(
					{ email: fanEmail, version: fan.version },
					{ $inc: { followNum: 1, version: 1 } },
					{ new: true }
				),
				User.findOneAndUpdate(
					{ email: followedEmail, version: followedUser.version },
					{ $inc: { fanNum: 1, version: 1 } },
					{ new: true }
				)
			])
			if (!updatedFan || !updatedFollowed) {
				await Fan.deleteOne({ fanEmail: newFan.email })
				return res.sendError(409, 'User data has been modified')
			}
			action = 'followed'
			const mutualFan = await Fan.findOne({
				fanEmail: followedEmail,
				fanEmail: followedEmail
			})
			if (mutualFan) {
				await Friend.create({
					email1: fanEmail,
					email2: followedEmail
				})
				const [updatedFan, updatedFollowed] = await Promise.all([
					User.findOneAndUpdate({ email: fanEmail }, { $inc: { friendNum: 1 } }, { new: true }),
					User.findOneAndUpdate({ email: followedEmail }, { $inc: { friendNum: 1 } }, { new: true })
				])
				if (!updatedFan || !updatedFollowed) {
					await Friend.deleteOne({ email1: fanEmail, email2: followedEmail })
					throw new Error('Failed to update friendNum')
				}
			}
		}
		res.sendSuccess({ message: `Successfully ${action} user` })
	} catch (error) {
		await Fan.deleteOne({ fanEmail, followedEmail })
		await User.findOneAndUpdate({ email: fanEmail }, { $inc: { followNum: -1 } })
		await User.findOneAndUpdate({ email: followedEmail }, { $inc: { fanNum: -1 } })
		console.error('Error in followUser:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getOnesInfo = async (req, res) => {
	const { email, type } = req.query
	if (!email) return res.sendError(400, 'email is required')
	if (!['fan', 'follow', 'friend'].includes(type))
		return res.sendError(400, 'type must be one of [fan, follow, friend]')
	try {
		let relatedEmails = []
		let users = []
		switch (type) {
			case 'fan':
				const fans = await Fan.find({ followedEmail: email }).lean()
				relatedEmails = fans.map(fan => fan.fanEmail)
				break
			case 'follow':
				const follows = await Fan.find({ fanEmail: email }).lean()
				relatedEmails = follows.map(follow => follow.followedEmail)
				break
			case 'friend':
				const friends = await Friend.find({
					$or: [{ email1: email }, { email2: email }]
				}).lean()
				relatedEmails = friends.map(friend =>
					friend.email1 === email ? friend.email2 : friend.email1
				)
				break
		}
		if (relatedEmails.length > 0) {
			users = await User.find(
				{ email: { $in: relatedEmails } },
				{
					email: 1,
					nickname: 1,
					avatar: 1,
					_id: 0,
					introduction: 1,
					token: 1,
					lastLoginDate: 1,
					sex: 1
				}
			).lean()
			const currentUserFollows = await Fan.find({ fanEmail: email }).lean()
			const followedEmails = new Set(currentUserFollows.map(f => f.followedEmail))
			users = users.map(user => ({
				...user,
				isFollowing: followedEmails.has(user.email)
			}))
		}
		const total = users.length
		res.sendSuccess({
			message: `${type} info fetched successfully`,
			users,
			total
		})
	} catch (error) {
		console.error('Error in getOnesInfo:', error)
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
	changeLive,
	followUser,
	getOnesInfo
}
