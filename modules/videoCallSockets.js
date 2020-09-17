module.exports = (socketIO) => {
    const io = socketIO.of('/videoCall');
    
    const users = {};
    const socketToRoom = {};
    
    io.on('connection', socket => {
        socket.on("join room", roomID => {
            if (users[roomID]) {
                const length = users[roomID].length;
                // if (length === 4) {
                //     socket.emit("room full");
                //     return;
                // }
                users[roomID].push(socket.id);
            } else {
                users[roomID] = [socket.id];
            }
            socket.join(roomID);
            socketToRoom[socket.id] = roomID;
            const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
            console.log(socket.id + ' connected.');
            socket.emit("all users", usersInThisRoom);
        });
    
        socket.on("sending signal", payload => {
            console.log(payload.callerID + ' sending signal to ' + payload.userToSignal)
    
            io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
        });
    
        socket.on("returning signal", payload => {
            console.log(socket.id + ' returning signal to ' + payload.callerID)
            io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
        });
    
        socket.on('disconnect', () => {
            const roomID = socketToRoom[socket.id];
            socket.leave(roomID);
            let room = users[roomID];
            if (room) {
                room = room.filter(id => id !== socket.id);
                users[roomID] = room;
            }
            console.log("Users in room : " + roomID + " are - " + users[roomID]);
            io.to(roomID).emit("user left", socket.id);
        });
    });    
}