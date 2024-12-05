const ErrorLog = require('../mongodb/errorLog.js')

const commitErrorLog = async (req, res) => {
	const { errorContent } = req.body
	if (!errorContent) return res.sendError(400, 'errorContent is required')
	try {
		const errorLog = new ErrorLog({ errorContent, createTime: new Date() })
		await errorLog.save()
		res.sendSuccess({ message: 'ErrorLog committed successfully' })
	} catch (error) {
		console.error('Error in commitErrorLog:', error)
		res.sendError(500, 'Internal server error')
	}
}

module.exports = {
	commitErrorLog
}
