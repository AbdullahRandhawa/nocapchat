## Project Overview

**NoCap Chat** is a real-time chat application built with React and Firebase. It features:

- **User Authentication**: Firebase-based login/signup with custom token support
- **Real-time Messaging**: Instant message delivery using Firebase Firestore
- **Rich Media Support**: Emoji picker, image sharing via Cloudinary, file attachments, video/audio calls
- **Responsive Design**: Optimized for mobile, tablet, and desktop screens with adaptive layouts
- **Modern Tech Stack**: React 18, Vite, Zustand for state management, Firebase for backend
- **Theme Support**: Dark/Light mode with cross-tab synchronization
- **SSO Integration**: Custom Firebase token authentication for seamless login

## Recommended README Structure

```markdown
# NoCap Chat

A modern, real-time chat application with rich media support and responsive design.

## Features

- 💬 **Real-time Messaging** - Instant message delivery with Firestore
- 🔐 **Secure Authentication** - Firebase auth with custom token support
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop
- 🎨 **Theme Support** - Dark/light mode with persistent preferences
- 😊 **Emoji Picker** - Built-in emoji support for expressive messaging
- 📸 **Media Sharing** - Image uploads via Cloudinary
- 📎 **File Attachments** - Share files seamlessly
- 📞 **Voice & Video** - Audio/video call integration
- 🎯 **User Search** - Find and connect with other users
- 🔔 **Notifications** - Real-time message notifications

## Tech Stack

- **Frontend**: React 18, Vite, CSS3
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore)
- **Media**: Cloudinary, emoji-picker-react
- **Utils**: js-cookie, react-toastify
- **Linting**: ESLint with React plugins

## Installation

1. Clone the repository
```bash
git clone https://github.com/AbdullahRandhawa/nocapchat.git
cd nocapchat
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
- Create a Firebase project
- Add your credentials to `src/lib/firebase.js`

4. Configure Cloudinary
- Set up Cloudinary in `src/lib/cloudinary.js`

## Usage

**Development**:
```bash
npm run dev
```

**Build**:
```bash
npm run build
```

**Preview**:
```bash
npm run preview
```

**Lint**:
```bash
npm lint
```

## Project Structure

```
nocapchat/
├── src/
│   ├── components/
│   │   ├── chat/          # Chat interface
│   │   ├── detail/        # User details panel
│   │   ├── list/          # Chat list
│   │   ├── login/         # Authentication
│   │   └── notification/  # Toast notifications
│   ├── lib/
│   │   ├── firebase.js    # Firebase config
│   │   ├── userStore.js   # User state (Zustand)
│   │   ├── chatStore.js   # Chat state (Zustand)
│   │   └── cloudinary.js  # Media upload config
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   ├── index.css          # Global styles
│   └── app.css            # App-specific styles
├── public/                # Assets (icons, images)
├── package.json
└── vite.config.js
```

## Key Features Explained

### Authentication Flow
- User logs in via email/password or custom token
- Firebase Custom Token support for SSO integration
- Automatic login with URL parameters or cookies

### Real-time Messaging
- Firestore stores user chats and messages
- Zustand manages chat state globally
- Messages update in real-time across tabs

### Responsive Layout
- Mobile: Single-view layout (list → chat → details)
- Tablet: Two-view layout
- Desktop: Three-view layout (list, chat, details)

### Theme Synchronization
- URL parameter: `?theme=dark` or `?theme=light`
- PostMessage API for cross-tab sync
- Persists via CSS custom properties

## SSO Integration

The app supports custom Firebase tokens for seamless SSO:
- Token via URL: `?fbToken=YOUR_TOKEN`
- Token via cookie: `fbToken=YOUR_TOKEN`
- Automatic authentication on app load

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Abdullah Randhawa

## Getting Help

If you encounter any issues:
1. Check existing GitHub Issues
2. Ensure Firebase and Cloudinary are properly configured
3. Clear browser cache and cookies
4. Check browser console for error messages
```

This README covers all the essential information a user needs to understand and use your project!
