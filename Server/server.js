
const express = require('express')
const http = require('http');
const socketIO = require('socket.io');
const chalk = require('chalk');

const playerData = new Map();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { PORT, FrameInterval } = require('./config.json');

app.use(express.static('public'));

io.on('connection', (socket) => {
    // 當有新的WebRTC ICE Candidate被傳遞時，轉發給對方
    socket.on('ice-candidate', (data) => {
        socket.to("123").emit('ice-candidate', data.candidate);
    });

    // 當有新的SDP被傳遞時，轉發給對方
    socket.on('sdp', (data) => {
        data.sdp.uuid = socket.id;
        socket.to("123").emit('sdp', data.sdp);
    });

    // 當接收到玩家資料時 將資料保存到Map中
    socket.on('player-data', (data) => {
        playerData.set(socket.id, JSON.parse(data));
    });

    // 當玩家斷線時刪除資料
    socket.on('disconnect', () => {
        playerData.delete(socket.id);
    })

    // 將玩家加入房間
    socket.join("123");
});

server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});

const header = chalk.blueBright(`Socket.io Server 運行於 PORT: `) + chalk.yellow(PORT) + "\n" + chalk.blueBright(`每幀間隔為: `) + chalk.yellow(FrameInterval) + chalk.blueBright(` FPS: `) + chalk.yellow((1 / (FrameInterval / 1000)));

setInterval(() => {
    console.clear();
    console.log(header);
    console.log("玩家資料數量: " + chalk.green(playerData.size));
    console.log("玩家資料:");
    console.log(playerData);
    console.log("玩家Socket連接數量: " + chalk.green(io.sockets.sockets.size));
    console.log("玩家Sockets:");
    console.log(Array.from(io.sockets.sockets.values()).map(value => value.id));

    Array.from(io.sockets.sockets.values()).forEach(socket => {
        obj = Object.fromEntries(playerData);
        delete obj[socket.id];
        socket.emit('player-data', JSON.stringify(obj));
    })
}, FrameInterval)