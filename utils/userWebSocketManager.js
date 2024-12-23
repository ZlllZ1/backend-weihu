const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

class UserWebSocketManager {
	constructor() {
		this.connections = new Map()
		this.wss = null
	}

	initialize(server) {
		this.wss = new WebSocket.Server({ noServer: true })
		server.on('upgrade', (request, socket, head) => {
			this.authenticateConnection(request, (err, userId, email) => {
				if (err) {
					socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
					socket.destroy()
					return
				}
				this.wss.handleUpgrade(request, socket, head, ws => {
					this.handleConnection(ws, userId, email)
				})
			})
		})
	}

	authenticateConnection(request, callback) {
		const token = new URL(request.url, 'http://localhost').searchParams.get('token')
		if (!token) return callback(new Error('No token provided'))
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET)
			const userId = new mongoose.Types.ObjectId(decoded.id)
			const email = decoded.email
			callback(null, userId, email)
		} catch (error) {
			callback(error)
		}
	}

	handleConnection(ws, userId, email) {
		if (this.connections.has(email)) {
			const oldConnection = this.connections.get(email)
			oldConnection.close()
		}
		this.connections.set(email, ws)
		ws.userId = userId
		ws.email = email
		ws.on('message', message => this.handleMessage(ws, message))
		ws.on('close', () => this.handleClose(ws))
	}

	handleMessage(ws, message) {
		// 处理接收到的消息
	}

	handleClose(ws) {
		if (ws.email) {
			this.connections.delete(ws.email)
		}
	}

	sendToUser(email, message) {
		const connection = this.connections.get(email)
		if (connection && connection.readyState === WebSocket.OPEN) {
			connection.send(JSON.stringify(message))
		} else {
			console.log(`User ${email} is not connected`)
		}
	}

	broadcastToAll(message, excludeUserId = null) {
		this.connections.forEach((connection, email) => {
			if (email !== excludeUserId && connection.readyState === WebSocket.OPEN) {
				connection.send(JSON.stringify(message))
			}
		})
	}

	getUserCount() {
		return this.connections.size
	}
}

module.exports = new UserWebSocketManager()
