# 🚀 ChatNova Quick Start Guide

## Super Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd chatnova
./setup.sh
```
Or manually:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Start the Server
Open a new terminal:
```bash
cd chatnova/server
npm start
```
You should see: `Server running on port 5000`

### Step 3: Start the Client
Open another terminal:
```bash
cd chatnova/client
npm start
```
The browser will automatically open to `http://localhost:3000`

## First Time Use

1. **Create Your Account**
   - Click "Sign Up"
   - Enter your name (e.g., "John Doe")
   - Choose a username (e.g., "john")
   - Set a password
   - Click "Sign Up"

2. **Test with Multiple Users**
   - Open a new incognito/private window
   - Go to `http://localhost:3000`
   - Create another account (e.g., "Jane", username: "jane")
   - Now you can chat between the two users!

3. **Start Chatting**
   - Click the "New Chat" button (💬)
   - Select a contact
   - Type your message
   - Press Enter or click Send

## Testing Features

### Test Real-time Messaging
1. Open two browser windows side by side
2. Login as different users in each
3. Send messages back and forth
4. Watch them appear instantly!

### Test Group Chat
1. Click the group icon (👥)
2. Enter a group name
3. Select 2+ members
4. Click "Create Group"
5. Send group messages

### Test File Sharing
1. Open a chat
2. Click the attachment icon
3. Select an image or document
4. See it upload and display

### Test Voice/Video Calls
1. Open a chat
2. Click the phone (📞) or video (📹) icon
3. Accept the call in another window
4. Test call features

## Common Issues & Solutions

### "Port 3000 is already in use"
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Or change the port in package.json
```

### "Cannot connect to server"
- Make sure the server is running on port 5000
- Check `http://localhost:5000` in your browser
- Look for "Server running on port 5000" in terminal

### "Messages not sending"
- Check browser console for errors (F12)
- Verify Socket.io connection
- Restart both server and client

## Tips & Tricks

### Multiple Users for Testing
- Use different browsers (Chrome, Firefox, Edge)
- Use incognito/private windows
- Use different browser profiles

### Keyboard Shortcuts
- `Enter` - Send message
- `Shift + Enter` - New line in message

### Development Tips
- Keep both terminals open (server and client)
- Watch for errors in both terminals
- Check browser console (F12) for client errors
- Server automatically creates `uploads` folder

## What to Try First

1. ✅ Create 2-3 test accounts
2. ✅ Send text messages
3. ✅ Try emojis 😀
4. ✅ Share an image
5. ✅ Create a group
6. ✅ Test typing indicators
7. ✅ Try voice call feature
8. ✅ Reply to a message
9. ✅ Test online/offline status

## Stopping the Application

1. Press `Ctrl + C` in server terminal
2. Press `Ctrl + C` in client terminal

## Next Steps

- Customize the theme colors in `App.css`
- Add your own features
- Deploy to Heroku or Vercel
- Integrate a real database
- Add end-to-end encryption

## Need Help?

- Check the full `README.md` for detailed documentation
- Review the code comments
- Check browser console for errors
- Verify all dependencies are installed

---

Enjoy ChatNova! 🎉

If everything works, you should see:
- Beautiful WhatsApp-like interface
- Real-time message delivery
- Online status indicators
- Message read receipts
- Typing indicators
- And much more!
