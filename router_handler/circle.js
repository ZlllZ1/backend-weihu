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
					from: 'users',
					localField: 'friendEmail',
					foreignField: 'email',
					as: 'friendUser'
				}
			},
			{ $unwind: '$friendUser' },
			{
				$lookup: {
					from: 'settings',
					localField: 'friendUser.setting',
					foreignField: '_id',
					as: 'friendUserSetting'
				}
			},
			{ $unwind: '$friendUserSetting' },
			{
				$lookup: {
					from: 'circles',
					let: {
						friendEmail: '$friendEmail',
						friendCircleLimit: '$friendUserSetting.circleLimit'
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$email', '$$friendEmail'] },
										{ $eq: ['$show', true] },
										{
											$or: [
												{ $eq: ['$$friendCircleLimit', 0] },
												{
													$gte: [
														'$publishDate',
														{
															$subtract: [
																new Date(),
																{
																	$multiply: [
																		{
																			$switch: {
																				branches: [
																					{ case: { $eq: ['$$friendCircleLimit', 3] }, then: 3 },
																					{ case: { $eq: ['$$friendCircleLimit', 7] }, then: 7 },
																					{ case: { $eq: ['$$friendCircleLimit', 30] }, then: 30 },
																					{
																						case: { $eq: ['$$friendCircleLimit', 180] },
																						then: 180
																					},
																					{ case: { $eq: ['$$friendCircleLimit', 365] }, then: 365 }
																				],
																				default: 0
																			}
																		},
																		24 * 60 * 60 * 1000
																	]
																}
															]
														}
													]
												}
											]
										}
									]
								}
							}
						}
					],
					as: 'friendCircles'
				}
			},
			{ $unwind: '$friendCircles' },
			{
				$group: {
					_id: null,
					circles: { $push: '$friendCircles' }
				}
			},
			{
				$lookup: {
					from: 'circles',
					pipeline: [{ $match: { email: email, show: true } }],
					as: 'userCircles'
				}
			},
			{
				$project: {
					allCircles: { $concatArrays: ['$circles', '$userCircles'] }
				}
			},
			{ $unwind: '$allCircles' },
			{ $sort: { 'allCircles.publishDate': -1 } },
			{ $skip: skip },
			{ $limit: limit },
			{
				$lookup: {
					from: 'praisecircles',
					let: { circleId: '$allCircles.circleId', circleEmail: '$allCircles.email' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$circleId', '$$circleId'] },
										{
											$or: [
												{ $eq: ['$email', email] },
												{ $eq: ['$email', '$$circleEmail'] },
												{
													$and: [
														{
															$in: [
																'$email',
																{ $literal: await getCommonFriends(email, '$$circleEmail') }
															]
														},
														{ $ne: ['$email', email] },
														{ $ne: ['$email', '$$circleEmail'] }
													]
												}
											]
										}
									]
								}
							}
						}
					],
					as: 'praises'
				}
			},
			{
				$lookup: {
					from: 'circlecomments',
					let: { circleId: '$allCircles.circleId', circleEmail: '$allCircles.email' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$circleId', '$$circleId'] },
										{
											$or: [
												{ $eq: ['$user.email', email] },
												{ $eq: ['$user.email', '$$circleEmail'] },
												{
													$and: [
														{
															$in: [
																'$user.email',
																{ $literal: await getCommonFriends(email, '$$circleEmail') }
															]
														},
														{ $ne: ['$user.email', email] },
														{ $ne: ['$user.email', '$$circleEmail'] }
													]
												}
											]
										}
									]
								}
							}
						}
					],
					as: 'comments'
				}
			},
			{
				$addFields: {
					'allCircles.isPraise': {
						$in: [email, '$praises.email']
					},
					'allCircles.praiseNum': { $size: '$praises' },
					'allCircles.commentNum': { $size: '$comments' }
				}
			},
			{
				$group: {
					_id: null,
					circles: { $push: '$allCircles' },
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

const getCommonFriends = async (email1, email2) => {
	const friends1 = await Friend.find({ $or: [{ email1: email1 }, { email2: email1 }] })
	const friends2 = await Friend.find({ $or: [{ email1: email2 }, { email2: email2 }] })
	const friendList1 = friends1.map(f => (f.email1 === email1 ? f.email2 : f.email1))
	const friendList2 = friends2.map(f => (f.email1 === email2 ? f.email2 : f.email1))
	const commonFriends = friendList1.filter(f => friendList2.includes(f))
	commonFriends.push(email2)
	return commonFriends
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
		const commonFriends = await getCommonFriends(email, circleEmail)
		const emailsToQuery = [...commonFriends, email, circleEmail]
		let comments = await CircleComment.find({
			circleId,
			'user.email': { $in: emailsToQuery }
		})
			.sort({ commentDate: 1 })
			.lean()
		comments = comments
			.filter(comment => {
				if (!comment.parentId) return true
				const parentComment = comments.find(c => c._id.toString() === comment.parentId.toString())
				return parentComment && emailsToQuery.includes(parentComment.user.email)
			})
			.map(comment => ({
				...comment,
				user: {
					...comment.user,
					own: comment.user.email === circleEmail
				}
			}))
		const organizedComments = []
		comments.forEach(comment => {
			if (!comment.parentId) organizedComments.push(comment)
			else {
				const parentIndex = organizedComments.findIndex(
					c => c._id.toString() === comment.parentId.toString()
				)
				if (parentIndex !== -1) organizedComments.splice(parentIndex + 1, 0, comment)
			}
		})
		res.sendSuccess({ message: 'circle comments fetch successfully', comments: organizedComments })
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
		let commonFriends = []
		let praises = []
		if (email === circleEmail) {
			praises = await PraiseCircle.find({ circleId }).lean()
		} else {
			commonFriends = await getCommonFriends(email, circleEmail)
			commonFriends.push(email, circleEmail)
			praises = await PraiseCircle.find({
				circleId,
				email: { $in: commonFriends }
			}).lean()
		}
		const userDetails = await User.find(
			{ email: { $in: praises.map(p => p.email) } },
			'email avatar'
		).lean()
		const result = praises.map(praise => {
			const userDetail = userDetails.find(u => u.email === praise.email)
			return {
				...praise,
				avatar: userDetail ? userDetail.avatar : null,
				isCommonFriend: commonFriends.includes(praise.email) || email === circleEmail
			}
		})
		result.sort((a, b) => {
			if (a.email === email) return -1
			if (b.email === email) return 1
			if (a.email === circleEmail) return -1
			if (b.email === circleEmail) return 1
			return new Date(b.praiseDate) - new Date(a.praiseDate)
		})
		res.sendSuccess({ message: 'Praise users fetched successfully', praiseUsers: result })
	} catch (error) {
		console.error('Error in getPraiseUsers:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getMyCircles = async (req, res) => {
	const { email, type, visitEmail } = req.query
	const limit = parseInt(req.query.limit) || 10
	const page = parseInt(req.query.page) || 1
	const skip = (page - 1) * limit
	if (!email || !visitEmail) return res.sendError(400, 'email or visitEmail is required')
	try {
		const user = await User.findOne({ email }).populate('setting')
		if (!user) return res.sendError(404, 'User not found')
		const circleLimit = user.setting.circleLimit
		const visibilityDate = new Date(Date.now() - circleLimit * 24 * 60 * 60 * 1000)
		const commonFriendEmails = await getCommonFriends(email, visitEmail)
		let matchQuery = { email }
		if (email !== visitEmail) {
			matchQuery.show = true
			matchQuery.publishDate = { $gte: visibilityDate }
		} else {
			if (type === 'before')
				matchQuery.$or = [{ show: false }, { publishDate: { $lt: visibilityDate } }]
			else if (type === 'after') {
				matchQuery.publishDate = { $gte: visibilityDate }
				matchQuery.show = true
			}
		}
		const result = await Circle.aggregate([
			{ $match: matchQuery },
			{ $sort: { publishDate: -1 } },
			{ $skip: skip },
			{ $limit: limit },
			{
				$lookup: {
					from: 'praisecircles',
					let: { circleId: '$circleId' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$circleId', '$$circleId'] },
										{ $in: ['$email', commonFriendEmails] }
									]
								}
							}
						}
					],
					as: 'praises'
				}
			},
			{
				$lookup: {
					from: 'circlecomments',
					let: { circleId: '$circleId' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$circleId', '$$circleId'] },
										{
											$or: [
												{ $in: ['$user.email', commonFriendEmails] },
												{ $eq: ['$user.email', email] },
												{ $eq: ['$user.email', visitEmail] }
											]
										}
									]
								}
							}
						}
					],
					as: 'comments'
				}
			},
			{
				$addFields: {
					isPraise: {
						$cond: {
							if: { $in: [visitEmail, '$praises.email'] },
							then: true,
							else: false
						}
					},
					praiseNum: { $size: '$praises' },
					commentNum: {
						$size: '$comments'
					}
				}
			},
			{
				$project: {
					praises: 0
				}
			}
		])
		const total = await Circle.countDocuments(matchQuery)
		res.sendSuccess({
			message: 'Circles fetched successfully',
			circles: result,
			total,
			currentPage: page,
			totalPages: Math.ceil(total / limit)
		})
	} catch (error) {
		console.error('Error in getMyCircles:', error)
		res.sendError(500, 'Internal server error')
	}
}

const deleteCircle = async (req, res) => {
	const { circleId, email } = req.body
	if (!circleId || !email) return res.sendError(400, 'circleId or email is required')
	try {
		const circle = await Circle.findOne({ circleId })
		if (!circle) return res.sendError(404, 'Circle not found')
		if (circle.email !== email) return res.sendError(403, 'You are not the owner of this circle')
		await Circle.findOneAndDelete({ circleId })
		await User.findOneAndUpdate({ email }, { $inc: { circleNum: -1 } })
		await CircleComment.deleteMany({ circleId })
		await PraiseCircle.deleteMany({ circleId })
		res.sendSuccess({ message: 'Circle deleted successfully' })
	} catch (error) {
		console.error('Error in deleteCircle:', error)
		res.sendError(500, 'Internal server error')
	}
}

const hideCircle = async (req, res) => {
	const { circleId, email } = req.body
	if (!circleId || !email) return res.sendError(400, 'circleId or email is required')
	try {
		const circle = await Circle.findOne({ circleId })
		if (!circle) return res.sendError(404, 'Circle not found')
		if (circle.email !== email) return res.sendError(403, 'You are not the owner of this circle')
		await Circle.findOneAndUpdate({ circleId }, { show: false })
		res.sendSuccess({ message: 'Circle hidden successfully' })
	} catch (error) {
		console.error('Error in hideCircle:', error)
		res.sendError(500, 'Internal server error')
	}
}

const showCircle = async (req, res) => {
	const { circleId, email } = req.body
	if (!circleId || !email) return res.sendError(400, 'circleId or email is required')
	try {
		const circle = await Circle.findOne({ circleId })
		if (!circle) return res.sendError(404, 'Circle not found')
		if (circle.email !== email) return res.sendError(403, 'You are not the owner of this circle')
		await Circle.findOneAndUpdate({ circleId }, { show: true })
		res.sendSuccess({ message: 'Circle hidden successfully' })
	} catch (error) {
		console.error('Error in hideCircle:', error)
		res.sendError(500, 'Internal server error')
	}
}

const deleteComment = async (req, res) => {
	const { circleId, commentId, email } = req.body
	if (!circleId || !commentId || !email)
		return res.sendError(400, 'circleId, commentId and email are required')
	try {
		const circle = await Circle.findOne({ circleId })
		if (!circle) return res.sendError(404, 'Circle not found')
		const comment = await CircleComment.findOne({ circleId, _id: commentId })
		if (!comment) return res.sendError(404, 'Comment not found')
		if (circle.email !== email && comment.user.email !== email)
			return res.sendError(403, 'You are not authorized to delete this comment')
		const commentsToDelete = await getCommentsToDelete(circleId, commentId)
		const deleteResult = await CircleComment.deleteMany({ _id: { $in: commentsToDelete } })
		const deleteNum = deleteResult.deletedCount
		await Circle.findOneAndUpdate({ circleId }, { $inc: { commentNum: -deleteNum } })
		res.sendSuccess({ message: 'Comment deleted successfully', deleteNum })
	} catch (error) {
		console.error('Error in deleteComment:', error)
		res.sendError(500, 'Internal server error')
	}
}
const getCommentsToDelete = async (circleId, commentId) => {
	const commentsToDelete = [commentId]
	let childComments = await CircleComment.find({ circleId, parentId: commentId })
	for (let childComment of childComments) {
		commentsToDelete.push(childComment._id)
		const grandChildComments = await getCommentsToDelete(circleId, childComment._id)
		commentsToDelete.push(...grandChildComments)
	}
	return commentsToDelete
}

module.exports = {
	publishCircle,
	getCircles,
	praiseCircle,
	uploadCircleImg,
	commentCircle,
	getCircleComments,
	getPraiseUsers,
	getMyCircles,
	deleteCircle,
	hideCircle,
	showCircle,
	deleteComment
}
