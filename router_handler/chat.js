const Chat = require('../mongodb/chat')
const User = require('../mongodb/user')
const Message = require('../mongodb/message')
const TempUpload = require('../mongodb/tempUpload.js')

const getFriendLists = async (req, res) => {
	const { email } = req.query
	if (!email) return res.sendError(400, 'email is required')
	try {
		const friendLists = await Chat.aggregate([
			{ $match: { 'participants.email': email } },
			{
				$addFields: {
					myUnreadCount: {
						$filter: {
							input: '$participants',
							as: 'participant',
							cond: { $eq: ['$$participant.email', email] }
						}
					},
					friend: {
						$filter: {
							input: '$participants',
							as: 'participant',
							cond: { $ne: ['$$participant.email', email] }
						}
					}
				}
			},
			{
				$project: {
					chatId: 1,
					lastMessage: 1,
					createdAt: 1,
					updatedAt: 1,
					myUnreadCount: { $arrayElemAt: ['$myUnreadCount.unreadCount', 0] },
					friend: {
						$arrayElemAt: [
							{
								$map: {
									input: '$friend',
									as: 'f',
									in: {
										email: '$$f.email',
										nickname: '$$f.nickname',
										avatar: '$$f.avatar'
									}
								}
							},
							0
						]
					}
				}
			},
			{
				$addFields: {
					sortOrder: {
						$cond: [{ $gt: ['$myUnreadCount', 0] }, 0, 1]
					},
					firstLetter: { $substr: [{ $toLower: '$friend.nickname' }, 0, 1] }
				}
			},
			{
				$sort: {
					sortOrder: 1,
					'lastMessage.timestamp': -1,
					firstLetter: 1
				}
			},
			{
				$project: {
					sortOrder: 0,
					firstLetter: 0
				}
			}
		])
		res.sendSuccess({ friendLists })
	} catch (error) {
		console.error('Error in getFriendLists:', error)
		res.sendError(500, 'Internal server error')
	}
}

const getChatInfos = async (req, res) => {
	const { email, chatId } = req.query
	const page = parseInt(req.query.page) || 1
	const limit = parseInt(req.query.limit) || 30
	const skip = (page - 1) * limit
	if (!email || !chatId) return res.sendError(400, 'email or chatId is required')
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const friendEmail = chatId.split('_').find(e => e !== email)
		if (!friendEmail) return res.sendError(400, 'Invalid chatId')
		const friend = await User.findOne({ email: friendEmail }, 'nickname email avatar')
		if (!friend) return res.sendError(404, 'Friend not found')
		const messages = await Message.find({ chatId })
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(Number(limit))
			.populate('sender', 'email')
		const unreadCount = await Message.countDocuments({
			chatId,
			sender: { $ne: user._id },
			isRead: false
		})
		res.sendSuccess({
			messages,
			unreadCount,
			friend: { nickname: friend.nickname, email: friend.email, avatar: friend.avatar },
			currentPage: Number(page)
		})
	} catch (error) {
		console.error('Error in getChatInfo:', error)
		res.sendError(500, 'Internal server error')
	}
}

const uploadChatImg = async (req, res) => {
	const { email } = req
	if (!email) return res.sendError(400, 'email is required')
	try {
		const user = await User.findOne({ email })
		if (!user) return res.sendError(404, 'User not found')
		const uniqueId = uuidv4()
		const fileExt = path.extname(req.file.originalname)
		const ossPath = `chat/${uniqueId}${fileExt}`
		const result = await OssClient.uploadFile(ossPath, req.file.path)
		fs.unlinkSync(req.file.path)
		await TempUpload.create({
			email,
			ossPath,
			url: result.url,
			createdAt: new Date()
		})
		res.sendSuccess({ message: 'chatImg upload successfully', chatImgUrl: result.url })
	} catch (error) {
		console.error('Error in uploadChatImg:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	getFriendLists,
	getChatInfos,
	uploadChatImg
}
