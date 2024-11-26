const schedule = require('node-schedule')
const AuthCode = require('../../mongodb/authCode.js')

const cleanAuthCode = async () => {
	try {
		const result = await AuthCode.deleteMany({ expires: { $lt: new Date() } })
	} catch (error) {
		console.error('Error in cleanAuthCode:', error)
	}
}

const scheduleClean = () => {
	schedule.scheduleJob('*/30 * * * *', cleanAuthCode)
}

scheduleClean()
