const nodemailer = require('nodemailer')

const transporter163 = nodemailer.createTransport({
	host: 'smtp.163.com',
	port: 465,
	secure: true,
	auth: {
		user: '15292021323@163.com',
		pass: 'TGP7LxJTDA5Vr7KY'
	}
})

const transporterQQ = nodemailer.createTransport({
	host: 'smtp.qq.com',
	port: 465,
	secure: true,
	auth: {
		user: '2060909362@qq.com',
		pass: 'avzqbwhhbxtrcjgh'
	}
})

module.exports.send163 = mailOptions => {
	transporter163.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error)
		}
	})
}

module.exports.sendQQ = mailOptions => {
	transporterQQ.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error)
		}
	})
}
