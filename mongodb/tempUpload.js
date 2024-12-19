const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tempUploadSchema = new Schema({
	email: String,
	ossPath: String,
	url: String,
	createdAt: { type: Date, default: Date.now }
})

const TempUpload = mongoose.model('TempUpload', tempUploadSchema)

module.exports = TempUpload
