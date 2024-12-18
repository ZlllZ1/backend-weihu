const { Circle, createCircle } = require('../mongodb/circle')
const User = require('../mongodb/user')
const { Friend } = require('../mongodb/fan')
const PraiseCircle = require('../mongodb/praiseCircle')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const OssClient = require('../utils/ossClient.js')
const fs = require('fs')
const CircleComment = require('../mongodb/circleComment')
const moment = require('moment')

const publishCircle = async (req, res) => {
	const { email, content, delta } = req.body
	if (!email || !content) return res.sendError(400, 'email and content are required')
	try {
		const user = await User.findOne({ email }, { email: 1, nickname: 1, avatar: 1 })
		if (!user) return res.sendError(404, 'User not found')
		const circleData = {
			email,
			content,
			user: {
				email: user.email,
				nickname: user.nickname,
				avatar: user.avatar
			},
			delta,
			publishDate: new Date()
		}
		const circle = await createCircle(circleData)
		const updatedUser = await User.findOneAndUpdate(
			{ email },
			{ $inc: { circleNum: 1 } },
			{ new: true }
		)
		if (!updatedUser) {
			await Circle.findByIdAndDelete(circle._id)
			return res.sendError(409, 'User data has been modified')
		}
		res.sendSuccess({ message: 'Circle published successfully', circleId: circle.circleId })
	} catch (error) {
		console.error('Error in publishCircle:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getCircles = async (req, res) => {
	const { email } = req.query
	const limit = parseInt(req.query.limit) || 10
	const page = parseInt(req.query.page) || 1
	const skip = (page - 1) * limit
	if (!email) return res.sendError(400, 'email is required')
	try {
		const result = await Friend.aggregate([
			{
				$match: { $or: [{ email1: email }, { email2: email }] }
			},
			{
				$project: {
					friendEmail: {
						$cond: { if: { $eq: ['$email1', email] }, then: '$email2', else: '$email1' }
					}
				}
			},
			{
				$lookup: {
					from: 'circles',
					let: { friendEmails: ['$friendEmail', email] },
					pipeline: [
						{ $match: { $expr: { $in: ['$email', '$$friendEmails'] } } },
						{ $sort: { publishDate: -1 } },
						{ $skip: skip },
						{ $limit: limit }
					],
					as: 'circles'
				}
			},
			{ $unwind: '$circles' },
			{ $replaceRoot: { newRoot: '$circles' } },
			{
				$lookup: {
					from: 'praisecircles',
					let: { circleId: '$circleId' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$eq: ['$email', email]
										},
										{ $eq: ['$circleId', '$$circleId'] }
									]
								}
							}
						}
					],
					as: 'praise'
				}
			},
			{
				$addFields: {
					isPraise: { $gt: [{ $size: '$praise' }, 0] }
				}
			},
			{
				$group: {
					_id: null,
					circles: { $push: '$$ROOT' },
					total: { $sum: 1 }
				}
			}
		])
		const { circles, total } = result[0] || { circles: [], total: 0 }
		res.sendSuccess({ message: 'Circles fetched successfully', circles, total })
	} catch (error) {
		console.error('Error in getCircles:', error)
		res.sendError(500, 'Internal server error')
	}
}

const praiseCircle = async (req, res) => {
	const { email, circleId } = req.body
	if (!email || !circleId) return res.sendError(400, 'email and circleId are required')
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const circle = await Circle.findOne({ circleId })
		if (!circle) return res.sendError(404, 'Circle not found')
		const praise = await PraiseCircle.findOne({ circleId, email })
		if (praise) {
			await Promise.all([
				PraiseCircle.deleteOne({ circleId, email }),
				Circle.updateOne({ circleId: circle.circleId }, { $inc: { praiseNum: -1 } })
			])
			return res.sendSuccess({ message: 'Praise canceled successfully' })
		} else {
			const newPraise = new PraiseCircle({
				circleId,
				email,
				praiseDate: Date.now()
			})
			await newPraise.save()
			await Circle.updateOne({ circleId: circle.circleId }, { $inc: { praiseNum: 1 } })
			return res.sendSuccess({ message: 'Praise successfully' })
		}
	} catch (error) {
		console.error('Error in praiseCircle:', error)
		res.sendError(500, 'Internal server error')
	}
}

const uploadCircleImg = async (req, res) => {
	const { email } = req
	if (!email) return res.sendError(400, 'email is required')
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const uniqueId = uuidv4()
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `circle/${uniqueId}${fileExt}`
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		fs.unlinkSync(req.file.path)
		res.sendSuccess({ message: 'circleImg upload successfully', circleImgUrl: result.url })
	} catch (error) {
		console.error('Error in uploadCircleImg:', error)
		res.sendError(500, 'Internal server error')
	}
}

const commentCircle = async (req, res) => {
	const { email, circleId, circleEmail, content, parentId, parentEmail } = req.body
	if (!email || !circleId || !content)
		return res.sendError(400, 'email or circleId or content is required')
	try {
		const circle = await Circle.findOne({ circleId })
		const newCircleComment = new CircleComment({
			circleEmail,
			circleId,
			content,
			parentId,
			parentEmail,
			commentDate: Date.now(),
			user: { email: email, own: email === circleEmail },
			parentUser: { email: parentEmail },
			commentNum: 0
		})
		circle.commentNum = circle.commentNum + 1
		await circle.save()
		await newCircleComment.save()
		res.sendSuccess({ message: 'Comment successfully', commentId: newCircleComment._id.toString() })
	} catch (error) {
		console.error('Error in comment:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getCircleComments = async (req, res) => {
	const { email, circleEmail, circleId } = req.query
	if (!email || !circleEmail || !circleId)
		return res.sendError(400, 'email or circleEmail or circleId is required')
	try {
		const commonFriends = await Friend.find({
			$or: [
				{ email1: email, email2: circleEmail },
				{ email1: circleEmail, email2: email }
			]
		}).lean()
		const emails = [
			...new Set([
				...commonFriends.map(f => f.email1),
				...commonFriends.map(f => f.email2),
				email,
				circleEmail
			])
		]
		let comments = await CircleComment.find({
			circleId,
			'user.email': { $in: emails }
		})
			.sort({ commentDate: 1 })
			.lean()
		comments = comments
			.filter(comment => {
				if (!comment.parentId) return true
				const parentComment = comments.find(c => c._id.toString() === comment.parentId.toString())
				return parentComment && emails.includes(parentComment.user.email)
			})
			.map(comment => ({
				...comment,
				user: {
					...comment.user,
					own: comment.user.email === circleEmail
				}
			}))
		const organizedComments = []
		const commentMap = new Map(comments.map(c => [c._id.toString(), c]))
		comments.forEach(comment => {
			if (!comment.parentId) organizedComments.push(comment)
			else {
				const parentIndex = organizedComments.findIndex(
					c => c._id.toString() === comment.parentId.toString()
				)
				if (parentIndex !== -1) organizedComments.splice(parentIndex + 1, 0, comment)
			}
		})
		res.sendSuccess({ comments: organizedComments })
	} catch (error) {
		console.error('Error in getCircleComments:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getPraiseUsers = async (req, res) => {
	const { email, circleEmail, circleId } = req.query
	if (!email || !circleEmail || !circleId)
		return res.sendError(400, 'email or circleEmail or circleId is required')
	try {
		const userFriends = await Friend.find({ $or: [{ email1: email }, { email2: email }] }).lean()
		const circleFriends = await Friend.find({
			$or: [{ email1: circleEmail }, { email2: circleEmail }]
		}).lean()
		const getUserFriendEmails = (friends, userEmail) =>
			friends.map(f => (f.email1 === userEmail ? f.email2 : f.email1))
		const userFriendEmails = new Set(getUserFriendEmails(userFriends, email))
		const circleFriendEmails = new Set(getUserFriendEmails(circleFriends, circleEmail))
		const commonFriends = new Set([...userFriendEmails].filter(x => circleFriendEmails.has(x)))
		const praises = await PraiseCircle.find({ circleId }).lean()
		const userDetails = await User.find(
			{ email: { $in: praises.map(p => p.email) } },
			'email avatar'
		).lean()
		const result = praises.map(praise => {
			const userDetail = userDetails.find(u => u.email === praise.email)
			return {
				...praise,
				avatar: userDetail ? userDetail.avatar : null,
				isCommonFriend: commonFriends.has(praise.email)
			}
		})
		result.sort((a, b) => {
			if (a.isCommonFriend === b.isCommonFriend)
				return new Date(b.praiseDate) - new Date(a.praiseDate)
			return b.isCommonFriend ? 1 : -1
		})
		res.sendSuccess({ message: 'Praise users fetched successfully', praiseUsers: result })
	} catch (error) {
		console.error('Error in getPraiseUsers:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getMyCircles = async (req, res) => {
	const { email, type } = req.query
	const limit = parseInt(req.query.limit) || 10
	const page = parseInt(req.query.page) || 1
	const skip = (page - 1) * limit
	if (!email) return res.sendError(400, 'email is required')
	try {
		const user = await User.findOne({ email }).populate('setting')
		if (!user) return res.sendError(404, 'User not found')
		const circleLimit = user.setting.circleLimit
		console.log(circleLimit, 'circleLimit')
		const visibilityDate = moment().subtract(circleLimit, 'days').toDate()
		console.log(visibilityDate, 'visibilityDate')
		let query = { email }
		if (type === 'before') {
			if (circleLimit !== 0) {
				query.publishDate = { $lt: visibilityDate }
			} else {
				return res.sendSuccess({ message: 'No circles', circles: [], total: 0 })
			}
		} else if (type === 'after') {
			if (circleLimit !== 0) {
				query.publishDate = { $gte: visibilityDate }
			}
		}
		const [circles, total] = await Promise.all([
			Circle.find(query).sort({ publishDate: -1 }).skip(skip).limit(limit),
			Circle.countDocuments({ query })
		])
		const circlesWithPraise = await Promise.all(
			circles.map(async circle => {
				const praiseRecord = await PraiseCircle.findOne({
					circleId: circle.circleId,
					email: email
				})
				return {
					...circle.toObject(),
					isPraise: !!praiseRecord
				}
			})
		)
		res.sendSuccess({
			circles: circlesWithPraise,
			total,
			currentPage: page,
			totalPages: Math.ceil(total / limit)
		})
	} catch (error) {
		console.error('Error in getMyCircles:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	publishCircle,
	getCircles,
	praiseCircle,
	uploadCircleImg,
	commentCircle,
	getCircleComments,
	getPraiseUsers,
	getMyCircles
}
