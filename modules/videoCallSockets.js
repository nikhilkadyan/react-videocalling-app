module.exports = (socketIO) => {
    const io = socketIO.of('/videoCall');
    
    const users = {};
    const socketToRoom = {};
    
    io.on('connection', socket => {
        socket.on("join room", payload => {
            const roomID = payload.roomID;
            const phoneixID = payload.phoneixID;
            if (users[roomID]) {
                // const length = users[roomID].length;
                // if (length === 4) {
                //     socket.emit("room full");
                //     return;
                // }
                users[roomID].push({socketID: socket.id, phoneixID: phoneixID});
            } else {
                users[roomID] = [{socketID: socket.id, phoneixID: phoneixID}];
            }
            socket.join(roomID);
            socketToRoom[socket.id] = roomID;
            const usersInThisRoom = users[roomID].filter(u => u.socketID !== socket.id);
            console.log(socket.id + ' connected.');
            socket.emit("all users", usersInThisRoom);
        });
    
        socket.on("sending signal", payload => {
            console.log(payload.callerID + ' sending signal to ' + payload.userToSignal)
    
            io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, phoneixID: payload.phoneix });
        });
    
        socket.on("returning signal", payload => {
            console.log(socket.id + ' returning signal to ' + payload.callerID)
            io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
        });
        
        socket.on("mute all", payload => {
            console.log(socket.id + ' sent mute all to room ' + payload.roomID)
            io.to(payload.roomID).emit('mute', payload);
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