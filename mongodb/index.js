const mongoose = require('mongoose')

const connectDb = async () => {
	try {
		await mongoose
			.connect('mongodb://127.0.0.1:27017/main')
			.then(() => {
				require('../utils/task/cleanAuthCode.js')
			})
			.catch(err => console.error(err))
		console.log('数据库连接成功')
	} catch (error) {
		console.error('数据库连接失败', error)
		process.exit(1)
	}
}
mongoose.connection.on('connected', () => {
	console.log('mongoose连接建立')
})
mongoose.connection.on('error', err => {
	console.error('mongoose连接出错', err)
})
mongoose.connection.on('disconnected', () => {
	console.log('mongoose连接断开')
})

module.exports = {
	connectDb,
	mongoose
}
