const { mongoose } = require('./index.js')
const Schema = mongoose.Schema

const settingSchema = new Schema({
	userId: String,
	messageSetting: Number
})

const Setting = mongoose.model('Setting', settingSchema)

module.exports = Setting
