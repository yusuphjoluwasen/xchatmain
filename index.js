const express = require('express');
const app = express();
// const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    serveClient: false
    // cors: {
    //     credentials: false
    // }
});
const port = process.env.PORT || 4000;
const users = [];
const messages = []
let lastId = 1
let currentChatDetails = {

}

let messageStructure = {
    date:"",
    message:"",
    user:""
}

let typers = {}

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

// Routing
// app.use(express.static(path.join(__dirname, '/../public')));

// app.get('/private',function(req,res) {
//     res.redirect('privatechat.html');
// });


app.get('/',function(req,res) {
    res.send('welcome to home');
});


app.get('/public',function(req,res) {
    res.send('welcome to public chat');
});


//Chat
io.on('connection', (socket) => {
    console.log("user connected sucessfully")


    socket.on('user connected', (payload) => {

        const username = filterUserByName(payload)
        let user
        if (username === "not exist"){

            user = {
                socketid: socket.id,
                name: payload,
                id:lastId++
            };
            users.push(user)
            currentChatDetails = {
                user:user,
                messages:[]
            }
            socket.broadcast.emit('user connected', currentChatDetails);
        }else{

            const index = users.findIndex(user => user.id === username.id)
            username.socketid = socket.id
            users[index] = username
            currentChatDetails = {
                user:username,
                messages:messages
            }

            socket.emit('user connected', currentChatDetails);
            console.log(messages)
        }
        console.log(username)



        // console.log(users);
    })

    //listening to chat message
    socket.on('chat message', (data) => {
        console.log(data);
        let filteredUser = users.filter(user => {
            return user.socketid === socket.id
        })
        console.log(users)
        console.log(filteredUser)
        let messageObj
        messageObj = {
            date:data.date,
            message:data.message,
            user:filteredUser[0]
        };
        messageStructure = {
            date:data.date,
            message:data.message,
            user:filteredUser[0]
        }
        messages.push(messageStructure)

        socket.broadcast.emit('chat message', messageObj);
    });

    socket.on('user typing', () => {
        typers[socket.id] = 1
        let user = filterUserBySocketId(socket.id)
        if (user !== "not exist"){
            //get username
            const username = user.name
            let typingdata
            const typersLength = Object.keys(typers).length
            typingdata = {
                username:username,
                numberOfTypers:typersLength
            }
            //create message
            socket.broadcast.emit('user typing', typingdata)
        }
    });

    socket.on('user stopped typing', () => {
        delete typers[socket.id];
        let numberOfTypers
        numberOfTypers =  Object.keys(typers).length
        socket.broadcast.emit('user stopped typing', numberOfTypers)
    });

    //listening to disconnect from user
    socket.on('disconnect', () => {
        const user = filterUserBySocketId(socket.id)
        if (user !== "not exist"){
            socket.broadcast.emit("leavegenchat", user.name)
        }

        console.log('user disconnected');
    });


})

let filterUserById = (id) => {
    let filteredUser = users.filter(user => {
        return user.id === id
    })

    return filteredUser.length !== 0 ? filteredUser[0] : "not exist";
}

let filterUserBySocketId = (socketId) => {
    let filteredUser = users.filter(user => {
        return user.socketid === socketId
    })

    return filteredUser.length !== 0 ? filteredUser[0] : "not exist";
}

let filterUserByName = (name) => {
    let filteredUser = users.filter(user => {
        return user.name === name
    })

    return filteredUser.length !== 0 ? filteredUser[0] : "not exist";
}