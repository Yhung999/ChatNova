const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      /\.vercel\.app$/,  // Allow all Vercel deployments
      /\.herokuapp\.com$/,  // Allow Heroku
      /\.onrender\.com$/  // Allow Render
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100 MB
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    /\.vercel\.app$/,
    /\.herokuapp\.com$/,
    /\.onrender\.com$/
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// In-memory storage (replace with database in production)
const users = new Map();
const messages = new Map();
const groups = new Map();
const onlineUsers = new Map();
const contactRequests = new Map(); // username -> [{ from, to, status, timestamp }]
const contacts = new Map(); // username -> [accepted contact usernames]

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    filename: req.file.filename,
    url: `http://localhost:5000/uploads/${req.file.filename}`,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Profile picture upload endpoint
app.post('/upload-profile', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { username } = req.body;
  const user = users.get(username);
  
  if (user) {
    user.avatar = `http://localhost:5000/uploads/${req.file.filename}`;
    users.set(username, user);
  }
  
  res.json({ 
    url: `http://localhost:5000/uploads/${req.file.filename}`
  });
});

// User registration
app.post('/api/register', (req, res) => {
  const { username, password, name, avatar } = req.body;
  
  if (users.has(username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  const user = {
    id: Date.now().toString(),
    username,
    password,
    name,
    avatar: avatar || `https://ui-avatars.com/api/?name=${name}&background=random`,
    status: 'Hey there! I am using ChatNova',
    lastSeen: new Date().toISOString(),
    contacts: []
  };
  
  users.set(username, user);
  res.json({ success: true, user: { ...user, password: undefined } });
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.get(username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ success: true, user: { ...user, password: undefined } });
});

// Get user contacts
app.get('/api/contacts/:username', (req, res) => {
  const user = users.get(req.params.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const userContacts = contacts.get(req.params.username) || [];
  
  const contactList = Array.from(users.values())
    .filter(u => userContacts.includes(u.username))
    .map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      status: u.status,
      lastSeen: u.lastSeen,
      online: onlineUsers.has(u.username)
    }));
  
  res.json(contactList);
});

// Search users (for adding contacts)
app.get('/api/search-users/:username/:query', (req, res) => {
  const { username, query } = req.params;
  const userContacts = contacts.get(username) || [];
  
  const searchResults = Array.from(users.values())
    .filter(u => 
      u.username !== username && 
      !userContacts.includes(u.username) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) || 
       u.username.toLowerCase().includes(query.toLowerCase()))
    )
    .map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      status: u.status
    }))
    .slice(0, 10);
  
  res.json(searchResults);
});

// Send contact request
app.post('/api/contact-request', (req, res) => {
  const { from, to } = req.body;
  
  const requestId = Date.now().toString();
  const request = {
    id: requestId,
    from,
    to,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  
  if (!contactRequests.has(to)) {
    contactRequests.set(to, []);
  }
  contactRequests.get(to).push(request);
  
  res.json({ success: true, request });
});

// Get contact requests
app.get('/api/contact-requests/:username', (req, res) => {
  const requests = contactRequests.get(req.params.username) || [];
  const pendingRequests = requests
    .filter(r => r.status === 'pending')
    .map(r => {
      const fromUser = users.get(r.from);
      return {
        ...r,
        fromUser: fromUser ? {
          username: fromUser.username,
          name: fromUser.name,
          avatar: fromUser.avatar
        } : null
      };
    });
  
  res.json(pendingRequests);
});

// Accept/Reject contact request
app.post('/api/contact-request/respond', (req, res) => {
  const { requestId, username, accept } = req.body;
  
  const userRequests = contactRequests.get(username) || [];
  const request = userRequests.find(r => r.id === requestId);
  
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  request.status = accept ? 'accepted' : 'rejected';
  
  if (accept) {
    // Add to contacts for both users
    if (!contacts.has(username)) contacts.set(username, []);
    if (!contacts.has(request.from)) contacts.set(request.from, []);
    
    contacts.get(username).push(request.from);
    contacts.get(request.from).push(username);
  }
  
  res.json({ success: true, request });
});

// Update user profile
app.post('/api/update-profile', (req, res) => {
  const { username, name, status, avatar, wallpaper } = req.body;
  const user = users.get(username);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (name) user.name = name;
  if (status) user.status = status;
  if (avatar) user.avatar = avatar;
  if (wallpaper !== undefined) user.wallpaper = wallpaper;
  
  users.set(username, user);
  res.json({ success: true, user: { ...user, password: undefined } });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('user_connected', (username) => {
    onlineUsers.set(username, socket.id);
    socket.username = username;
    
    // Broadcast online status
    io.emit('user_status', { username, online: true });
    
    // Send user their message history with all contacts
    const userContacts = contacts.get(username) || [];
    const messageHistory = {};
    
    userContacts.forEach(contactUsername => {
      const chatKey1 = `${username}-${contactUsername}`;
      const chatKey2 = `${contactUsername}-${username}`;
      
      const msgs = messages.get(chatKey1) || messages.get(chatKey2) || [];
      messageHistory[contactUsername] = msgs;
    });
    
    socket.emit('message_history', messageHistory);
    
    // Send pending contact requests
    const pendingRequests = (contactRequests.get(username) || [])
      .filter(r => r.status === 'pending')
      .map(r => {
        const fromUser = users.get(r.from);
        return {
          ...r,
          fromUser: fromUser ? {
            username: fromUser.username,
            name: fromUser.name,
            avatar: fromUser.avatar
          } : null
        };
      });
    
    socket.emit('contact_requests', pendingRequests);
  });
  
  socket.on('send_message', (data) => {
    const message = {
      id: Date.now().toString(),
      from: data.from,
      to: data.to,
      text: data.text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      type: data.type || 'text',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      replyTo: data.replyTo
    };
    
    // Store message with consistent chat key (alphabetically sorted usernames)
    const chatKey = [data.from, data.to].sort().join('-');
    
    if (!messages.has(chatKey)) {
      messages.set(chatKey, []);
    }
    messages.get(chatKey).push(message);
    
    // Send to recipient if online
    const recipientSocketId = onlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', message);
      message.status = 'delivered';
    }
    
    // Confirm to sender
    socket.emit('message_sent', message);
  });
  
  socket.on('message_read', (data) => {
    const { messageId, from, to } = data;
    const recipientSocketId = onlineUsers.get(to);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message_status', {
        messageId,
        status: 'read',
        from
      });
    }
  });
  
  socket.on('typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user_typing', {
        from: data.from,
        isTyping: data.isTyping
      });
    }
  });
  
  socket.on('create_group', (data) => {
    const group = {
      id: Date.now().toString(),
      name: data.name,
      avatar: data.avatar || `https://ui-avatars.com/api/?name=${data.name}&background=random`,
      members: data.members,
      admin: data.admin,
      createdAt: new Date().toISOString(),
      messages: []
    };
    
    groups.set(group.id, group);
    
    // Notify all members
    data.members.forEach(member => {
      const socketId = onlineUsers.get(member);
      if (socketId) {
        io.to(socketId).emit('group_created', group);
      }
    });
    
    socket.emit('group_created', group);
  });
  
  socket.on('send_group_message', (data) => {
    const group = groups.get(data.groupId);
    if (!group) return;
    
    const message = {
      id: Date.now().toString(),
      from: data.from,
      groupId: data.groupId,
      text: data.text,
      timestamp: new Date().toISOString(),
      type: data.type || 'text',
      fileUrl: data.fileUrl,
      fileName: data.fileName
    };
    
    group.messages.push(message);
    
    // Send to all group members
    group.members.forEach(member => {
      const socketId = onlineUsers.get(member);
      if (socketId) {
        io.to(socketId).emit('receive_group_message', message);
      }
    });
  });
  
  socket.on('voice_call_initiate', (data) => {
    const recipientSocketId = onlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incoming_call', {
        from: data.from,
        callId: data.callId,
        type: data.type
      });
    }
  });
  
  socket.on('voice_call_accept', (data) => {
    const callerSocketId = onlineUsers.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', {
        from: data.from,
        callId: data.callId
      });
    }
  });
  
  socket.on('voice_call_reject', (data) => {
    const callerSocketId = onlineUsers.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_rejected', {
        from: data.from,
        callId: data.callId
      });
    }
  });
  
  socket.on('webrtc_signal', (data) => {
    const recipientSocketId = onlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('webrtc_signal', {
        from: data.from,
        signal: data.signal
      });
    }
  });
  
  socket.on('send_contact_request', (data) => {
    const { from, to } = data;
    const recipientSocketId = onlineUsers.get(to);
    
    if (recipientSocketId) {
      const fromUser = users.get(from);
      io.to(recipientSocketId).emit('new_contact_request', {
        id: data.requestId,
        from,
        to,
        status: 'pending',
        timestamp: new Date().toISOString(),
        fromUser: fromUser ? {
          username: fromUser.username,
          name: fromUser.name,
          avatar: fromUser.avatar
        } : null
      });
    }
  });
  
  socket.on('contact_request_response', (data) => {
    const { requestId, from, accept } = data;
    const recipientSocketId = onlineUsers.get(from);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('contact_request_update', {
        requestId,
        accepted: accept,
        username: socket.username
      });
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      io.emit('user_status', { username: socket.username, online: false });
      
      // Update last seen
      const user = users.get(socket.username);
      if (user) {
        user.lastSeen = new Date().toISOString();
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
