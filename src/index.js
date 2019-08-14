const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { generateLocationMessage} = require('./utils/locationMessage')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New Websocket connection')
    socket.on('join', ({ username, room }, callback) => {
        const { error, user} = addUser({ id:socket.id,username,room})

        if (error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('Message',generateMessage('Admin ','Welcome!'))
        socket.broadcast.to(user.room).emit('Message',generateMessage('Admin',`${user.username} has joined the chatroom`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users : getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('Message', generateMessage(user.username,message))
        callback('Delivered')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('Message',generateMessage('Admin ',`${user.username} has left!`))   
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',(cordinates, callback)=>{
        user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${cordinates.latitude},${cordinates.longitude}`))
        callback('location shared')
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

