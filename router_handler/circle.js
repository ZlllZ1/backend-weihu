const { Circle, createCircle } = require('../mongodb/circle')
const User = require('../mongodb/user')
const { Friend } = require('../mongodb/fan')
const PraiseCircle = require('../mongodb/praiseCircle')

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

module.exports = {
	publishCircle,
	getCircles,
	praiseCircle
}
