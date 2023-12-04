require('dotenv').config()
const express = require('express')
const socketio = require('socket.io')
const app = express()

app.set('view engine', 'ejs')

app.get('/', (req, res)=> {
    res.render('home')
})

app.get('/login', (req, res)=> {
    res.render('login')
})

app.get('/chat', (req, res)=> {
    res.render('chat')
})

const PORT = process.env.PORT || 8080   
const httpServer = app.listen(PORT, () => {
    console.log('http://localhost:'+ PORT)
})

const io = socketio(httpServer)

io.on('connection', client => {
    console.log(`CLient ${client.id} connected`)

    client.free = true
    client.loginAt = new Date().toLocaleTimeString()

    let users = Array.from(io.sockets.sockets.values())
            .map(socket => ({id: socket.id, username: socket.username, loginAt: socket.loginAt, free: socket.free}))
    console.log(users)

    client.on('disconected', () => {
        console.log(`\t\t${client.id} has left`)

        //thong bao cho tat ca cac user con lai truoc khi minh thoat
        client.broadcast.emit('user-leave', client.id)
    })

    client.on('register-name', username => {
        client.username = username

        // gửi thông tin đăng ký cho tất cả các user còn lại
        client.broadcast.emit('register-name', {id: client.id, username: username})
    })
    
    // gui danh sach user dang online cho nguoi moi
    client.emit('list-users', users)

    //gửi thông tin người mới cho tất cả các người trước đó
    client.broadcast.emit('new-user', {id: client.id, username: client.username, loginAt: client.loginAt, free: client.free})

    client.on('open-chat', message => {
        console.log(`Received sample message from ${client.id}: ${message}`);
        client.emit('open-chat-response', { success: true });
    });
})