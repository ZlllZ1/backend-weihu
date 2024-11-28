require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectDb } = require('./mongodb/index.js')
const verifyToken = require('./utils/verifyToken.js')
const apiResponseMiddleware = require('./utils/apiResponseMiddleware.js')
const userRouter = require('./router/user')
const loginRouter = require('./router/login')

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(apiResponseMiddleware)
app.use('/user', verifyToken, userRouter)
app.use('/login', loginRouter)

const startServer = async () => {
	try {
		await connectDb()
		app.listen(3007, () => {
			console.log('启动服务器 http://127.0.0.1:3007')
		})
	} catch (error) {
		console.error('Failed to start server:', error)
		process.exit(1)
	}
}
startServer()

app.get('/', (req, res) => {
	res.send('hello world')
})
