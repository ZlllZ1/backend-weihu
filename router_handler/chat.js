const Chat = require('../mongodb/chat')
const User = require('../mongodb/user')
const Message = require('../mongodb/message')
const TempUpload = require('../mongodb/tempUpload.js')
const Notification = require('../mongodb/notification')
const UserWebSocketManager = require('../utils/userWebsocketManager.js')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')
const OssClient = require('../utils/ossClient.js')

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
					firstLetter: { $substr: [{ $toLower: '$friend.nickname' }, 0, 1] }
				}
			},
			{
				$sort: {
					'lastMessage.timestamp': -1,
					firstLetter: 1
				}
			},
			{
				$project: {
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
	const limit = parseInt(req.query.limit) || 100
	const skip = (page - 1) * limit
	if (!email || !chatId) return res.sendError(400, 'email and chatId are required')
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
			.limit(limit)
			.populate('senderEmail', 'email')
		const unreadCount = await Message.countDocuments({
			chatId,
			senderEmail: { $ne: email },
			isRead: false
		})
		res.sendSuccess({
			messages: messages.reverse(),
			unreadCount,
			friend: { nickname: friend.nickname, email: friend.email, avatar: friend.avatar },
			currentPage: page
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

const sendMessages = async (req, res) => {
	try {
		const { chatId, content, senderEmail, recipientEmail } = req.body
		const newMessage = new Message({
			chatId,
			senderEmail,
			content,
			timestamp: new Date(),
			isRead: false
		})
		await newMessage.save()
		const updatedChat = await Chat.findOneAndUpdate(
			{ chatId },
			{
				$set: {
					'lastMessage.content': content,
					'lastMessage.senderEmail': senderEmail,
					'lastMessage.timestamp': new Date()
				},
				$inc: { 'participants.$[elem].unreadCount': 1 }
			},
			{
				arrayFilters: [{ 'elem.email': recipientEmail }],
				new: true
			}
		)
		const notification = new Notification({
			recipient: recipientEmail,
			type: 'message',
			senderEmail,
			content: `${senderEmail} 发送了新消息`,
			relatedItem: {
				itemType: 'chat',
				itemId: chatId
			}
		})
		await notification.save()
		UserWebSocketManager.sendToUser(recipientEmail, {
			type: 'chat',
			data: {
				chatId,
				message: newMessage,
				senderEmail
			}
		})
		res.sendSuccess({
			message: 'Message sent successfully',
			message: newMessage,
			chat: updatedChat
		})
	} catch (error) {
		console.error('Error in sendMessages:', error)
		res.sendError(500, 'Internal server error')
	}
}

const readMessages = async (req, res) => {
	const { email, senderEmail, chatId } = req.body
	if (!email || !senderEmail || !chatId)
		return res.sendError(400, 'email, senderEmail, and chatId are required')
	try {
		const updatedChat = await Chat.findOneAndUpdate(
			{ chatId },
			{
				$set: {
					'participants.$[userElem].unreadCount': 0
				}
			},
			{
				arrayFilters: [{ 'userElem.email': email }],
				new: true
			}
		)
		if (!updatedChat) return res.sendError(404, 'Chat not found')
		await Message.updateMany({ chatId, senderEmail }, { $set: { isRead: true } })
		res.sendSuccess({ message: 'Messages marked as read successfully' })
	} catch (error) {
		console.error('Error in readMessages:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	getFriendLists,
	getChatInfos,
	uploadChatImg,
	sendMessages,
	readMessages
}
