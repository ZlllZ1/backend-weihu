const mongoose = require('mongoose')
const Schema = mongoose.Schema

const praiseCircleSchema = new Schema({
	circleId: Number,
	email: String,
	praiseDate: { type: Date, default: Date.now }
})

const PraiseCircle = mongoose.model('PraiseCircle', praiseCircleSchema)

module.exports = PraiseCircle
