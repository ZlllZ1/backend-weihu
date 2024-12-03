const Setting = require('../mongodb/setting.js')

const changeShowIp = async (req, res) => {
	const { account, showIp } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showIp = showIp
		await setting.save()
		res.sendSuccess({ message: 'ShowIp changed successfully' })
	} catch (error) {
		console.error('Error in changeShowIp:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeShowFan = async (req, res) => {
	const { account, showFan } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showFan = showFan
		await setting.save()
		res.sendSuccess({ message: 'showFan changed successfully' })
	} catch (error) {
		console.error('Error in changeShowFan:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeShowFollow = async (req, res) => {
	const { account, showFollow } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showFollow = showFollow
		await setting.save()
		res.sendSuccess({ message: 'showFollow changed successfully' })
	} catch (error) {
		console.error('Error in changeShowFollow:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeShowLive = async (req, res) => {
	const { account, showLive } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showLive = showLive
		await setting.save()
		res.sendSuccess({ message: 'showLive changed successfully' })
	} catch (error) {
		console.error('Error in changeShowLive:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeShowFriend = async (req, res) => {
	const { account, showFriend } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showFriend = showFriend
		await setting.save()
		res.sendSuccess({ message: 'showFriend changed successfully' })
	} catch (error) {
		console.error('Error in changeShowLive:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeShowShare = async (req, res) => {
	const { account, showShare } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showShare = showShare
		await setting.save()
		res.sendSuccess({ message: 'showShare changed successfully' })
	} catch (error) {
		console.error('Error in changeShowLive:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeShowCollect = async (req, res) => {
	const { account, showCollect } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showCollect = showCollect
		await setting.save()
		res.sendSuccess({ message: 'showCollect changed successfully' })
	} catch (error) {
		console.error('Error in changeShowLive:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeShowPraise = async (req, res) => {
	const { account, showPraise } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.showPraise = showPraise
		await setting.save()
		res.sendSuccess({ message: 'showPraise changed successfully' })
	} catch (error) {
		console.error('Error in changeShowLive:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changePostLimit = async (req, res) => {
	const { account, postLimit } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.postLimit = postLimit
		await setting.save()
		res.sendSuccess({ message: 'PostLimit changed successfully' })
	} catch (error) {
		console.error('Error in changePostLimit:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeCircleLimit = async (req, res) => {
	const { account, circleLimit } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.circleLimit = circleLimit
		await setting.save()
		res.sendSuccess({ message: 'CircleLimit changed successfully' })
	} catch (error) {
		console.error('Error in changeCircleLimit:', error)
		res.sendError(500, 'Internal server error')
	}
}

const changeChatLimit = async (req, res) => {
	const { account, chatLimit } = req.body
	if (!account) return res.sendError(400, 'account is required')
	try {
		const setting = await Setting.findOne({ email: account })
		setting.chatLimit = chatLimit
		await setting.save()
		res.sendSuccess({ message: 'ChatLimit changed successfully' })
	} catch (error) {
		console.error('Error in changeChatLimit:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	changeShowIp,
	changeShowFan,
	changeShowFollow,
	changeShowLive,
	changeShowFriend,
	changeShowShare,
	changeShowCollect,
	changeShowPraise,
	changePostLimit,
	changeCircleLimit,
	changeChatLimit
}
