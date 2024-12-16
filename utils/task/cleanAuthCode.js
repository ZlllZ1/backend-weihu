const AuthCode = require('../../mongodb/authCode.js')

const cleanAuthCode = async () => {
	try {
		await AuthCode.deleteMany({ expires: { $lt: new Date() } })
	} catch (error) {
		console.error('Error in cleanAuthCode:', error)
	}
}

module.exports = cleanAuthCode
