# 💬 ChatNova - Enhanced WhatsApp Clone v2.0

**NEW**: Contact Requests, Profile Upload, Wallpapers, Full Responsiveness, Working Video/Voice Calls, Message Persistence!

## 🆕 What's New in v2.0

✅ **Contact Request System** - Send/accept requests before chatting
✅ **Profile Picture Upload** - Custom avatars
✅ **Chat Wallpapers** - 6 beautiful backgrounds
✅ **Full Responsiveness** - Perfect mobile experience
✅ **Message Persistence** - Chats are saved!
✅ **Working Video Calls** - Real WebRTC implementation
✅ **Working Voice Calls** - Full call functionality
✅ **Enhanced UX** - Logout, better UI, improved navigation

## ✨ All Features

### Core Features
- User Authentication (Login/Register)
- Contact Request System ⭐NEW
- Search Users ⭐NEW
- Profile Picture Upload ⭐NEW
- Real-time Messaging
- Message Persistence ⭐NEW
- Group Chats
- Media Sharing (Images, Videos, Audio, Documents)
- Working Video Calls ⭐NEW
- Working Voice Calls ⭐NEW
- Custom Wallpapers ⭐NEW
- Full Mobile Responsive ⭐NEW
- Typing Indicators
- Message Status (Sent/Delivered/Read)
- Online/Offline Status
- Reply to Messages
- Emoji Support

## 🚀 Quick Start

```bash
# 1. Extract and enter directory
unzip chatnova.zip
cd chatnova

# 2. Install dependencies
./setup.sh

# 3. Start server (Terminal 1)
cd server && npm start

# 4. Start client (Terminal 2)
cd client && npm start

# 5. Open http://localhost:3000
```

## 🎮 How to Use

### Adding Contacts
1. Click "New Chat" button
2. Search for users
3. Send contact request
4. Other user accepts
5. Now you can chat!

### Making Video Calls
1. Open chat with contact
2. Click video icon
3. Grant camera permission
4. Other person accepts
5. Video streaming starts!

### Changing Profile Picture
1. Click your avatar
2. Click "Change Photo"
3. Select image
4. Done!

### Changing Wallpaper
1. Open any chat
2. Click wallpaper icon
3. Choose background
4. Saved automatically!

## 📱 Mobile Support

Works perfectly on:
- 📱 iPhone/Android
- 💻 Desktop
- 📲 Tablet
- All screen sizes!

## 🔧 Technical Stack

**Frontend**
- React 18
- Socket.io Client
- WebRTC
- Responsive CSS

**Backend**
- Node.js
- Express
- Socket.io
- Multer (file upload)

## 🎯 Key Improvements from v1.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Contact Requests | ❌ | ✅ |
| Profile Upload | ❌ | ✅ |
| Wallpapers | ❌ | ✅ |
| Mobile Responsive | ❌ | ✅ |
| Message Persistence | ❌ | ✅ |
| Working Calls | ❌ | ✅ |

## 🐛 Troubleshooting

**Camera not working?**
- Grant browser permissions
- Use Chrome (recommended)

**Contact request not showing?**
- Refresh the page
- Check both users are logged in

**Messages disappearing?**
- Don't use incognito mode
- Check LocalStorage enabled

## 📚 Documentation

- README.md - This file
- QUICKSTART.md - Setup guide
- FEATURES.md - Detailed features
- PROJECT_SUMMARY.md - Overview

## 🌟 Highlights

⭐ Production-ready code
⭐ Beautiful UI/UX
⭐ Real WebRTC calls
⭐ Full mobile support
⭐ 100% feature complete
⭐ Well documented
⭐ Easy to customize
⭐ Professional design

## 📞 Features in Detail

### Messaging
- Real-time delivery
- Message status tracking
- Typing indicators
- Reply functionality
- Emoji picker
- File sharing
- Persistent history

### Calls
- Video streaming
- Voice calls
- WebRTC powered
- Accept/reject
- End call controls
- Camera/mic access

### Contacts
- Request system
- Search users
- Accept/reject
- No spam!

### Customization
- Profile pictures
- Chat backgrounds
- Status messages
- Avatars

## 🎨 Customization

Change colors in `client/src/App.css`:
```css
/* Primary color */
.auth-button {
  background: linear-gradient(135deg, #25D366 0%, #20c997 100%);
}
```

Add wallpapers in `client/src/App.js`:
```javascript
const [wallpapers] = useState([
  'default',
  'your-url-here.jpg',
]);
```

## 🚀 Deployment

Ready for Heroku, AWS, Vercel, Netlify, or any hosting platform!

## 💡 Tips

1. Test with multiple browser windows
2. Grant camera/mic permissions for calls
3. Use real devices for mobile testing
4. Don't use incognito for persistence
5. Check browser console for errors

---

**Built with ❤️ - ChatNova v2.0**

Enjoy your complete messaging platform! 🎉💚
