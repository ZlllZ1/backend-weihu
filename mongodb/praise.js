const mongoose = require('mongoose')
const Schema = mongoose.Schema

const praiseSchema = new Schema({
	email: String,
	postId: String,
	praiseDate: { type: Date, default: Date.now }
})

const Praise = mongoose.model('Praise', praiseSchema)

module.exports = Praise
