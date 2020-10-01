module.exports = (socketIO) => {
    const io = socketIO.of('/videoCall');
    
    const users = {};
    const socketToRoom = {};
    
    io.on('connection', socket => {
        socket.on("join room", payload => {
            const roomID = payload.roomID;
            const phoneixID = payload.phoneixID;
            const data = payload.data;
            if (users[roomID]) {
                users[roomID].push({socketID: socket.id, phoneixID: phoneixID, data: data});
            } else {
                users[roomID] = [{socketID: socket.id, phoneixID: phoneixID, data: data}];
            }
            socket.join(roomID);
            socketToRoom[socket.id] = roomID;
            const usersInThisRoom = users[roomID].filter(u => u.socketID !== socket.id);
            console.log(socket.id + ' connected.');
            socket.emit("all users", usersInThisRoom);
        });
    
        socket.on("sending signal", payload => {
            console.log(payload.callerID + ' sending signal to ' + payload.userToSignal)
            io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, phoneixID: payload.phoneix, data: payload.data });
        });
    
        socket.on("returning signal", payload => {
            console.log(socket.id + ' returning signal to ' + payload.callerID)
            io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
        });
        
        socket.on("send task", payload => {
            console.log(socket.id + ' sent task to the room ' + payload.roomID)
            io.to(payload.roomID).emit('task', payload);
        });

        socket.on("message", payload => {
            console.log(socket.id + ' sent message to the room ' + payload.roomID)
            io.to(payload.roomID).emit('got message', payload);
        });

        socket.on('disconnect', () => {
            const roomID = socketToRoom[socket.id];
            socket.leave(roomID);
            let room = users[roomID];
            if (room) {
                room = room.filter(u => u.socketID !== socket.id);
                users[roomID] = room;
            }
            console.log("Users in room : " + roomID + " are - " + users[roomID]);
            io.to(roomID).emit("user left", socket.id);
        });
    });    
}