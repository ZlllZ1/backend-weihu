const mongoose = require('mongoose')
const Schema = mongoose.Schema

const fanSchema = new Schema({
	fanEmail: String,
	followedEmail: String,
	fanDate: { type: Date, default: Date.now }
})
fanSchema.index({ fanEmail: 1, fanDate: -1 })
fanSchema.index({ followedEmail: 1, fanDate: -1 })
fanSchema.index({ fanEmail: 1, followedEmail: 1 }, { unique: true })

const friendSchema = new Schema({
	email1: String,
	email2: String,
	friendDate: { type: Date, default: Date.now }
})
friendSchema.index({ email1: 1, friendDate: -1 })
friendSchema.index({ email2: 1, friendDate: -1 })
friendSchema.index({ email1: 1, email2: 1 }, { unique: true })

const Fan = mongoose.model('Fan', fanSchema)
const Friend = mongoose.model('Friend', friendSchema)

module.exports = { Fan, Friend }
