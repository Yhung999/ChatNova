import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import { API_URL, SOCKET_URL } from './api-config';

const socket = io(SOCKET_URL);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [groups, setGroups] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [contactRequests, setContactRequests] = useState([]);
  const [showContactRequests, setShowContactRequests] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [wallpapers] = useState([
    'default',
    'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png',
    'https://wallpapercave.com/wp/wp2509969.png',
    'https://wallpaperaccess.com/full/2631897.jpg',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200'
  ]);
  const [selectedWallpaper, setSelectedWallpaper] = useState('default');
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const profilePicInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '🙌', '👏', '😍', '🤔', '😎', '🥳', '😢', '😡', '🙏', '💪', '🎯', '✅'];

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('chatnovaUser');
    const savedWallpaper = localStorage.getItem('chatnovaWallpaper');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    if (savedWallpaper) {
      setSelectedWallpaper(savedWallpaper);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      socket.emit('user_connected', currentUser.username);
      fetchContacts();
      fetchContactRequests();
    }

    socket.on('receive_message', (message) => {
      setAllMessages(prev => {
        const key = message.from;
        const msgs = prev[key] || [];
        return { ...prev, [key]: [...msgs, message] };
      });
      
      if (selectedChat?.username === message.from) {
        setMessages(prev => [...prev, message]);
      } else {
        setUnreadCounts(prev => ({
          ...prev,
          [message.from]: (prev[message.from] || 0) + 1
        }));
      }
      
      playNotificationSound();
    });

    socket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
      setAllMessages(prev => {
        const key = message.to;
        const msgs = prev[key] || [];
        return { ...prev, [key]: [...msgs, message] };
      });
    });

    socket.on('message_history', (history) => {
      setAllMessages(history);
    });

    socket.on('message_status', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, status: data.status } : msg
      ));
    });

    socket.on('user_typing', (data) => {
      setTypingUsers(prev => ({ ...prev, [data.from]: data.isTyping }));
      setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [data.from]: false }));
      }, 3000);
    });

    socket.on('user_status', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.online) {
          newSet.add(data.username);
        } else {
          newSet.delete(data.username);
        }
        return newSet;
      });
    });

    socket.on('group_created', (group) => {
      setGroups(prev => [...prev, group]);
    });

    socket.on('receive_group_message', (message) => {
      if (selectedChat?.id === message.groupId) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('contact_requests', (requests) => {
      setContactRequests(requests);
    });

    socket.on('new_contact_request', (request) => {
      setContactRequests(prev => [...prev, request]);
      playNotificationSound();
    });

    socket.on('contact_request_update', (data) => {
      if (data.accepted) {
        fetchContacts();
      }
    });

    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    socket.on('call_accepted', () => {
      setActiveCall(prev => ({ ...prev, status: 'connected' }));
    });

    socket.on('call_rejected', () => {
      setActiveCall(null);
      setIncomingCall(null);
      cleanupCall();
    });

    socket.on('webrtc_signal', async (data) => {
      if (!peerConnection) return;
      
      try {
        if (data.signal.type === 'offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('webrtc_signal', {
            to: data.from,
            signal: answer
          });
        } else if (data.signal.type === 'answer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else if (data.signal.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
        }
      } catch (error) {
        console.error('WebRTC signaling error:', error);
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_sent');
      socket.off('message_history');
      socket.off('user_typing');
      socket.off('user_status');
      socket.off('group_created');
      socket.off('contact_requests');
      socket.off('new_contact_request');
      socket.off('incoming_call');
      socket.off('webrtc_signal');
    };
  }, [currentUser, selectedChat, peerConnection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatnovaWallpaper', selectedWallpaper);
  }, [selectedWallpaper]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSt+zPLTgjMGHm7A7+OZUQ==');
    audio.play().catch(() => {});
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin 
      ? { username, password }
      : { username, password, name };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('chatnovaUser', JSON.stringify(data.user));
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed');
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contacts/${currentUser.username}`);
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchContactRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contact-requests/${currentUser.username}`);
      const data = await response.json();
      setContactRequests(data);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
    }
  };

  const searchForUsers = async (query) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }
    
    setIsSearchingUsers(true);
    try {
      const response = await fetch(`${API_URL}/api/search-users/${currentUser.username}/${query}`);
      const data = await response.json();
      setSearchUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const sendContactRequest = async (toUsername) => {
    const requestId = Date.now().toString();
    try {
      await fetch('${API_URL}/api/contact-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: currentUser.username, to: toUsername })
      });
      
      socket.emit('send_contact_request', {
        from: currentUser.username,
        to: toUsername,
        requestId
      });
      
      alert('Contact request sent!');
      setSearchUsers([]);
      setUserSearchQuery('');
    } catch (error) {
      console.error('Error sending contact request:', error);
    }
  };

  const respondToContactRequest = async (requestId, accept) => {
    try {
      await fetch('${API_URL}/api/contact-request/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          username: currentUser.username, 
          accept 
        })
      });
      
      const request = contactRequests.find(r => r.id === requestId);
      if (request) {
        socket.emit('contact_request_response', {
          requestId,
          from: request.from,
          accept
        });
      }
      
      setContactRequests(prev => prev.filter(r => r.id !== requestId));
      
      if (accept) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error responding to contact request:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() && !replyTo) return;

    const messageData = {
      from: currentUser.username,
      to: selectedChat.username || selectedChat.id,
      text: newMessage,
      type: 'text',
      replyTo: replyTo
    };

    if (selectedChat.members) {
      socket.emit('send_group_message', {
        ...messageData,
        groupId: selectedChat.id
      });
    } else {
      socket.emit('send_message', messageData);
    }

    setNewMessage('');
    setReplyTo(null);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('${API_URL}/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      const messageData = {
        from: currentUser.username,
        to: selectedChat.username || selectedChat.id,
        text: '',
        type: type,
        fileUrl: data.url,
        fileName: file.name,
        fileSize: file.size
      };

      if (selectedChat.members) {
        socket.emit('send_group_message', {
          ...messageData,
          groupId: selectedChat.id
        });
      } else {
        socket.emit('send_message', messageData);
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const handleProfilePicUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', currentUser.username);

    try {
      const response = await fetch('${API_URL}/upload-profile', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      const updatedUser = { ...currentUser, avatar: data.url };
      setCurrentUser(updatedUser);
      localStorage.setItem('chatnovaUser', JSON.stringify(updatedUser));
      
      await fetch('${API_URL}/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, avatar: data.url })
      });
    } catch (error) {
      console.error('Profile pic upload error:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!selectedChat || selectedChat.members) return;
    
    socket.emit('typing', {
      from: currentUser.username,
      to: selectedChat.username,
      isTyping: true
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        from: currentUser.username,
        to: selectedChat.username,
        isTyping: false
      });
    }, 1000);
  };

  const handleCreateGroup = () => {
    if (!groupName || selectedMembers.length < 2) {
      alert('Please enter group name and select at least 2 members');
      return;
    }

    socket.emit('create_group', {
      name: groupName,
      members: [...selectedMembers, currentUser.username],
      admin: currentUser.username
    });

    setShowGroupModal(false);
    setGroupName('');
    setSelectedMembers([]);
  };

  const setupMediaDevices = async (isVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      return null;
    }
  };

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(configuration);
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_signal', {
          to: activeCall?.to || incomingCall?.from,
          signal: { candidate: event.candidate }
        });
      }
    };
    
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };
    
    setPeerConnection(pc);
    return pc;
  };

  const initiateCall = async (type) => {
    const callId = Date.now().toString();
    const stream = await setupMediaDevices(type === 'video');
    
    if (!stream) return;
    
    const pc = createPeerConnection(stream);
    
    setActiveCall({
      type,
      to: selectedChat.username,
      callId,
      status: 'calling'
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('voice_call_initiate', {
        from: currentUser.username,
        to: selectedChat.username,
        callId,
        type
      });
      
      socket.emit('webrtc_signal', {
        to: selectedChat.username,
        signal: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const acceptCall = async () => {
    const stream = await setupMediaDevices(incomingCall.type === 'video');
    
    if (!stream) return;
    
    createPeerConnection(stream);
    
    socket.emit('voice_call_accept', {
      from: currentUser.username,
      to: incomingCall.from,
      callId: incomingCall.callId
    });
    
    setActiveCall({ 
      ...incomingCall, 
      status: 'connected',
      to: incomingCall.from 
    });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    socket.emit('voice_call_reject', {
      from: currentUser.username,
      to: incomingCall.from,
      callId: incomingCall.callId
    });
    setIncomingCall(null);
    cleanupCall();
  };

  const endCall = () => {
    setActiveCall(null);
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    
    setRemoteStream(null);
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
    setShowSidebar(false);
    
    const chatMessages = allMessages[chat.username] || [];
    setMessages(chatMessages);
    
    setUnreadCounts(prev => ({ ...prev, [chat.username]: 0 }));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (lastSeen) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleLogout = () => {
    localStorage.removeItem('chatnovaUser');
    setCurrentUser(null);
    setContacts([]);
    setMessages([]);
    setAllMessages({});
    socket.disconnect();
  };

  if (!currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <div className="logo">
              <svg viewBox="0 0 24 24" width="40" height="40">
                <path fill="#25D366" d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.67-.33-3.82-.91l-.27-.17-2.82.74.75-2.82-.18-.28C4.83 15.33 4.5 14.04 4.5 12.67c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
              </svg>
              <h1>ChatNova</h1>
            </div>
            <p className="tagline">Connect with your world</p>
          </div>
          
          <form onSubmit={handleAuth} className="auth-form">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="auth-button">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
          
          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className={`sidebar ${!showSidebar ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="user-avatar"
            onClick={() => setShowProfile(true)}
          />
          <div className="sidebar-actions">
            {contactRequests.length > 0 && (
              <button 
                className="icon-btn request-btn" 
                onClick={() => setShowContactRequests(true)}
                title="Contact Requests"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span className="request-badge">{contactRequests.length}</span>
              </button>
            )}
            <button className="icon-btn" onClick={() => setShowNewChat(true)} title="New Chat">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"/>
              </svg>
            </button>
            <button className="icon-btn" onClick={() => setShowGroupModal(true)} title="New Group">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M16.5 8c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm-4 6c-3.31 0-6 2.69-6 6v2h12v-2c0-3.31-2.69-6-6-6z"/>
              </svg>
            </button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="search-box">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"/>
          </svg>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="chats-list">
          {[...contacts, ...groups]
            .filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => selectChat(chat)}
            >
              <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
              <div className="chat-info">
                <div className="chat-header-row">
                  <h3>{chat.name}</h3>
                  <span className="chat-time">
                    {chat.lastMessage?.timestamp ? formatTime(chat.lastMessage.timestamp) : ''}
                  </span>
                </div>
                <div className="chat-preview-row">
                  <p className="chat-preview">
                    {chat.members ? '👥 Group' : chat.status || 'Hey there! I am using ChatNova'}
                  </p>
                  {unreadCounts[chat.username] > 0 && (
                    <span className="unread-badge">{unreadCounts[chat.username]}</span>
                  )}
                  {!chat.members && onlineUsers.has(chat.username) && (
                    <span className="online-indicator"></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <button 
                className="mobile-back-btn"
                onClick={() => setShowSidebar(true)}
              >
                ←
              </button>
              <div className="chat-header-info">
                <img src={selectedChat.avatar} alt={selectedChat.name} className="chat-avatar" />
                <div>
                  <h2>{selectedChat.name}</h2>
                  <p className="status">
                    {selectedChat.members 
                      ? `${selectedChat.members.length} members`
                      : onlineUsers.has(selectedChat.username) 
                        ? 'online' 
                        : `last seen ${formatLastSeen(selectedChat.lastSeen)}`
                    }
                    {typingUsers[selectedChat.username] && (
                      <span className="typing-indicator"> typing...</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn" onClick={() => initiateCall('voice')} title="Voice Call">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </button>
                <button className="icon-btn" onClick={() => initiateCall('video')} title="Video Call">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                </button>
                <button className="icon-btn" onClick={() => setShowWallpaperPicker(true)} title="Change Wallpaper">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div 
              className="messages-container" 
              style={{
                backgroundImage: selectedWallpaper !== 'default' 
                  ? `url(${selectedWallpaper})` 
                  : 'none'
              }}
            >
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`message ${msg.from === currentUser.username ? 'sent' : 'received'}`}
                >
                  {msg.replyTo && (
                    <div className="reply-preview">
                      <div className="reply-border"></div>
                      <div className="reply-content">
                        <span className="reply-name">{msg.replyTo.from}</span>
                        <p>{msg.replyTo.text}</p>
                      </div>
                    </div>
                  )}
                  
                  {msg.type === 'image' && (
                    <img src={msg.fileUrl} alt="shared" className="message-image" />
                  )}
                  {msg.type === 'video' && (
                    <video src={msg.fileUrl} controls className="message-video" />
                  )}
                  {msg.type === 'audio' && (
                    <audio src={msg.fileUrl} controls className="message-audio" />
                  )}
                  {msg.type === 'document' && (
                    <div className="message-document">
                      <svg viewBox="0 0 24 24" width="40" height="40">
                        <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                      <div>
                        <p className="doc-name">{msg.fileName}</p>
                        <p className="doc-size">{(msg.fileSize / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  )}
                  
                  {msg.text && <p className="message-text">{msg.text}</p>}
                  
                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                    {msg.from === currentUser.username && (
                      <span className={`message-status ${msg.status}`}>
                        {msg.status === 'sent' && '✓'}
                        {msg.status === 'delivered' && '✓✓'}
                        {msg.status === 'read' && '✓✓'}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    className="message-reply-btn"
                    onClick={() => setReplyTo(msg)}
                    title="Reply"
                  >
                    ↩
                  </button>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {replyTo && (
              <div className="reply-bar">
                <div className="reply-info">
                  <span className="reply-label">Replying to {replyTo.from}</span>
                  <p className="reply-text">{replyTo.text}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="close-reply">×</button>
              </div>
            )}

            <div className="message-input-area">
              <div className="message-actions">
                <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
                  <svg viewBox="0 0 24 24" width="26" height="26">
                    <path fill="currentColor" d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"/>
                  </svg>
                </button>
                <button className="icon-btn" onClick={() => fileInputRef.current.click()} title="Attach Image">
                  <svg viewBox="0 0 24 24" width="26" height="26">
                    <path fill="currentColor" d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"/>
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e.target.files[0], 'image')}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  ref={documentInputRef}
                  onChange={(e) => handleFileUpload(e.target.files[0], 'document')}
                  style={{ display: 'none' }}
                />
                <button className="icon-btn" onClick={() => documentInputRef.current.click()} title="Attach Document">
                  <svg viewBox="0 0 24 24" width="26" height="26">
                    <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  </svg>
                </button>
              </div>

              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji, i) => (
                    <button
                      key={i}
                      className="emoji-btn"
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={handleTyping}
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <svg viewBox="0 0 303 172" width="360" height="210">
                <path fill="#25D366" d="M151.5 0C67.9 0 0 67.9 0 151.5S67.9 303 151.5 303 303 235.1 303 151.5 235.1 0 151.5 0zm0 276.9c-69.2 0-125.4-56.2-125.4-125.4S82.3 26.1 151.5 26.1s125.4 56.2 125.4 125.4-56.2 125.4-125.4 125.4z"/>
              </svg>
              <h1>ChatNova Web</h1>
              <p>Send and receive messages without keeping your phone online.</p>
              <p>Use ChatNova on up to 4 linked devices and 1 phone at the same time.</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Profile</h2>
              <button onClick={() => setShowProfile(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body profile-body">
              <div className="profile-pic-section">
                <img src={currentUser.avatar} alt={currentUser.name} className="profile-pic" />
                <button 
                  className="change-pic-btn"
                  onClick={() => profilePicInputRef.current.click()}
                >
                  Change Photo
                </button>
                <input
                  type="file"
                  ref={profilePicInputRef}
                  onChange={(e) => handleProfilePicUpload(e.target.files[0])}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              <div className="profile-info">
                <div className="info-item">
                  <label>Name</label>
                  <p>{currentUser.name}</p>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <p>{currentUser.status}</p>
                </div>
                <div className="info-item">
                  <label>Username</label>
                  <p>@{currentUser.username}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showNewChat && (
        <div className="modal-overlay" onClick={() => {
          setShowNewChat(false);
          setSearchUsers([]);
          setUserSearchQuery('');
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Contact</h2>
              <button onClick={() => {
                setShowNewChat(false);
                setSearchUsers([]);
                setUserSearchQuery('');
              }} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Search users by name or username..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  searchForUsers(e.target.value);
                }}
                className="search-users-input"
              />
              
              {isSearchingUsers && <p>Searching...</p>}
              
              <div className="search-results">
                {searchUsers.map(user => (
                  <div key={user.id} className="search-result-item">
                    <img src={user.avatar} alt={user.name} />
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <p>@{user.username}</p>
                    </div>
                    <button 
                      className="add-contact-btn"
                      onClick={() => sendContactRequest(user.username)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Requests Modal */}
      {showContactRequests && (
        <div className="modal-overlay" onClick={() => setShowContactRequests(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact Requests</h2>
              <button onClick={() => setShowContactRequests(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              {contactRequests.length === 0 ? (
                <p className="no-requests">No pending requests</p>
              ) : (
                <div className="requests-list">
                  {contactRequests.map(request => (
                    <div key={request.id} className="request-item">
                      <img src={request.fromUser?.avatar} alt={request.fromUser?.name} />
                      <div className="request-info">
                        <h4>{request.fromUser?.name}</h4>
                        <p>@{request.fromUser?.username}</p>
                      </div>
                      <div className="request-actions">
                        <button 
                          className="accept-btn"
                          onClick={() => respondToContactRequest(request.id, true)}
                        >
                          Accept
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => respondToContactRequest(request.id, false)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallpaper Picker Modal */}
      {showWallpaperPicker && (
        <div className="modal-overlay" onClick={() => setShowWallpaperPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose Wallpaper</h2>
              <button onClick={() => setShowWallpaperPicker(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="wallpaper-grid">
                {wallpapers.map((wallpaper, index) => (
                  <div
                    key={index}
                    className={`wallpaper-option ${selectedWallpaper === wallpaper ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedWallpaper(wallpaper);
                      setShowWallpaperPicker(false);
                    }}
                    style={{
                      backgroundImage: wallpaper !== 'default' ? `url(${wallpaper})` : 'none',
                      backgroundColor: wallpaper === 'default' ? '#efeae2' : 'transparent'
                    }}
                  >
                    {wallpaper === 'default' && <span>Default</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button onClick={() => setShowGroupModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="group-name-input"
              />
              <div className="members-list">
                <h3>Select Members</h3>
                {contacts.map(contact => (
                  <label key={contact.id} className="member-item">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(contact.username)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, contact.username]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(m => m !== contact.username));
                        }
                      }}
                    />
                    <img src={contact.avatar} alt={contact.name} />
                    <span>{contact.name}</span>
                  </label>
                ))}
              </div>
              <button onClick={handleCreateGroup} className="create-group-btn">
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="modal-overlay">
          <div className="call-modal">
            <div className="caller-info">
              <img 
                src={contacts.find(c => c.username === incomingCall.from)?.avatar} 
                alt="caller"
                className="caller-avatar"
              />
              <h2>{contacts.find(c => c.username === incomingCall.from)?.name}</h2>
              <p>Incoming {incomingCall.type} call</p>
            </div>
            <div className="call-actions">
              <button onClick={acceptCall} className="accept-call-btn">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="white" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </button>
              <button onClick={rejectCall} className="reject-call-btn">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="white" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Modal */}
      {activeCall && (
        <div className="modal-overlay">
          <div className="call-modal active-call">
            <div className="video-container">
              {activeCall.type === 'video' && (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="remote-video"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="local-video"
                  />
                </>
              )}
              {activeCall.type === 'voice' && (
                <div className="voice-call-info">
                  <img 
                    src={contacts.find(c => c.username === activeCall.to)?.avatar} 
                    alt="contact"
                    className="call-avatar"
                  />
                  <h2>{contacts.find(c => c.username === activeCall.to)?.name}</h2>
                  <p>{activeCall.status === 'calling' ? 'Calling...' : 'Connected'}</p>
                </div>
              )}
            </div>
            <button onClick={endCall} className="end-call-btn">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="white" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
