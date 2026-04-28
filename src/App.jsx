import Login from "./components/login/Login"
import List from "./components/list/List"
import Chat from "./components/chat/Chat"
import Detail from "./components/detail/Detail"
import Notification from "./components/notification/Notification"
import "./app.css"
import { useEffect, useState, useRef } from "react"
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth" // Added signInWithCustomToken
import { auth } from "./lib/firebase"
import { useUserStore } from "./lib/userStore"
import { useChatStore } from "./lib/chatStore"
import Cookies from "js-cookie" // Added this to read the cookie
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./lib/firebase";
import { toast } from "react-toastify";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore()
  const { chatId, changeChat } = useChatStore()

  const containerRef = useRef(null)

  // 0. THEME SYNC (New Logic)
  useEffect(() => {
    const applyTheme = (themeStr) => {
      document.documentElement.setAttribute('data-theme', themeStr);
    };

    // a. Initial Load via URL param
    const searchParams = new URLSearchParams(window.location.search);
    const initialTheme = searchParams.get('theme');
    if (initialTheme) {
      applyTheme(initialTheme);
    }

    // b. Real-time Parent Sync Listener
    const handleMessage = (event) => {
      // Allow syncing if the parent Rentlyst app hits the dark-mode toggle
      if (event.data && event.data.type === 'THEME_CHANGE') {
        applyTheme(event.data.theme);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 1. SILENT LOGIN SENSOR (New Logic)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get('fbToken');
    const cookieToken = Cookies.get('fbToken');
    const token = urlToken || cookieToken;

    // If we have a token from LocaStay but Firebase hasn't logged us in yet
    if (token && !auth.currentUser) {
      console.log("LocaStay token found! Authenticating...");
      signInWithCustomToken(auth, token).catch((err) => {
        console.error("Auto-login failed:", err.message);
        Cookies.remove('fbToken'); // Wipe bad token
      });
    }
  }, []); // Run once on mount

  // 2. AUTH STATE LISTENER (Your existing logic)
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, async (user) => {
      await fetchUserInfo(user ? user.uid : null);
      console.log("Firebase UID:", user?.uid)
    })

    return () => {
      unSub()
    }
  }, [fetchUserInfo])

  // 3. STATE-BASED MOBILE TOGGLE
  const [mobileView, setMobileView] = useState("list"); // "list", "chat", "detail"
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  console.log("Current Store User:", currentUser)

  useEffect(() => {
    const checkUrlForReceiver = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const receiverId = searchParams.get("receiverId");

      console.log("Checking URL for receiverId:", receiverId, "Current User:", currentUser?.id);

      // Only run if we have a receiverId, a logged-in user, and it's not ourselves
      if (receiverId && currentUser) {
        toast.info("Processing receiver: " + receiverId);
        if (currentUser.id === receiverId) {
            toast.info("You cannot message yourself.");
            window.history.replaceState(null, "", window.location.pathname);
            return;
        }

        try {
          // 1. Check if a chat with this owner already exists in your list
          const userChatsRef = doc(db, "userchats", currentUser.id);
          const userChatsSnap = await getDoc(userChatsRef);

          // Check if the receiver user actually exists in Firebase first
          const receiverSnap = await getDoc(doc(db, "users", receiverId));
          if (!receiverSnap.exists()) {
            console.log("Receiver does not exist in Firestore!");
            toast.error("User not found! They might have been deleted.");
            window.history.replaceState(null, "", window.location.pathname);
            return;
          }

          // Helper: create a new chat and open it
          const createAndOpenChat = async () => {
            const newChatRef = doc(collection(db, "chats"));
            await setDoc(newChatRef, {
              createdAt: serverTimestamp(),
              messages: [],
            });

            const chatData = {
              chatId: newChatRef.id,
              lastMessage: "",
              isSeen: true,
              updatedAt: Date.now(),
            };

            // Update the receiver's chat list (create doc if it doesn't exist)
            await setDoc(doc(db, "userchats", receiverId), {
              chats: arrayUnion({ ...chatData, receiverId: currentUser.id })
            }, { merge: true });

            // Update current user's chat list (create doc if it doesn't exist)
            await setDoc(doc(db, "userchats", currentUser.id), {
              chats: arrayUnion({ ...chatData, receiverId: receiverId })
            }, { merge: true });

            changeChat(newChatRef.id, { ...receiverSnap.data(), id: receiverId });
            setMobileView("chat");
          };

          if (userChatsSnap.exists()) {
            const chats = userChatsSnap.data().chats || [];
            const existingChat = chats.find(c => c.receiverId === receiverId);

            if (existingChat) {
              // Chat already exists — just open it
              changeChat(existingChat.chatId, { ...receiverSnap.data(), id: receiverId });
              setMobileView("chat");
            } else {
              // User exists but no chat with this person yet — create it
              await createAndOpenChat();
            }
          } else {
            // Current user has no userchats document at all — create it and the chat
            await createAndOpenChat();
          }

          // Clean the URL so it doesn't trigger again on refresh
          window.history.replaceState(null, "", window.location.pathname);
        } catch (err) {
          console.error("Auto-chat failed:", err);
          toast.error("Something went wrong opening the chat: " + err.message);
        }
      }
    };

    if (!isLoading && currentUser) {
      checkUrlForReceiver();
    }
  }, [currentUser, isLoading, changeChat]);

  if (isLoading) return <div className="loading">Loading...</div>

  return (
    <div className={`container ${chatId ? 'chat-active' : ''}`}>
      {currentUser ? (
        <>
          {(!isMobile && !isTablet) && (
            <>
              <List setMobileView={setMobileView} />
              <Chat setMobileView={setMobileView} showBackButton={false} showInfoButton={false} />
              <Detail setMobileView={setMobileView} />
            </>
          )}

          {isTablet && (
            <>
              {mobileView !== "detail" && <List setMobileView={setMobileView} />}
              <Chat 
                setMobileView={setMobileView} 
                showBackButton={mobileView === "detail"} 
                showInfoButton={mobileView !== "detail"} 
              />
              {mobileView === "detail" && <Detail setMobileView={setMobileView} />}
            </>
          )}

          {isMobile && (
            <>
              {mobileView === "list" && <List setMobileView={setMobileView} />}
              {mobileView === "chat" && <Chat setMobileView={setMobileView} showBackButton={true} showInfoButton={true} />}
              {mobileView === "detail" && <Detail setMobileView={setMobileView} />}
            </>
          )}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  )
}

export default App