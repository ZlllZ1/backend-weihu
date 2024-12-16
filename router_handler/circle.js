const { Circle, createCircle } = require('../mongodb/circle')
const User = require('../mongodb/user')
const { Friend } = require('../mongodb/fan')

const publishCircle = async (req, res) => {
	const { email, content, delta } = req.body
	if (!email || !content) return res.sendError(400, 'email or content is required')
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const commitUser = new User({
			email: user.email,
			nickname: user.nickname,
			avatar: user.avatar
		})
		const circleData = new Circle({
			email,
			content,
			user: commitUser,
			delta,
			publishDate: Date.now()
		})
		const circle = await createCircle(circleData)
		const updatedUser = await User.findOneAndUpdate(
			{ email },
			{ $inc: { circleNum: 1 } },
			{ new: true }
		)
		if (!updatedUser) {
			await Post.deleteOne({ email })
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

module.exports = {
	publishCircle,
	getCircles
}
