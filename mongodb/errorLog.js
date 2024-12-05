const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const errorLogSchema = new Schema({
	errorContent: String,
	createTime: { type: Date, default: Date.now }
})

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema)

module.exports = ErrorLog
