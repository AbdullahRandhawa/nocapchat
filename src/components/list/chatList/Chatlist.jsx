import { useEffect, useState } from "react"
import "./chatList.css"
import AddUser from "./addUser/AddUser"
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase"
import { useUserStore } from "../../../lib/userStore"
import { useChatStore } from "../../../lib/chatStore"

const Chatlist = ({ setMobileView }) => {
    const [addMode, setAddMode] = useState(false)
    const [chats, setChats] = useState([])
    const [input, setInput] = useState("")

    const { currentUser } = useUserStore()
    const { changeChat } = useChatStore()

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
            const data = res.data();
            if (!data || !data.chats) return;

            const items = data.chats;

            const promises = items.map(async (item) => {
                const userDocRef = doc(db, "users", item.receiverId)
                const userDocSnap = await getDoc(userDocRef)

                // If the user was deleted, this will be undefined
                const user = userDocSnap.data()

                return { ...item, user }
            })

            const chatData = await Promise.all(promises)
            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        })

        return () => {
            unSub()
        }
    }, [currentUser.id])

    const handleSelect = async (chat) => {
        // Safety: Don't try to open a chat with a non-existent user
        if (!chat.user) return;

        const updatedChats = chats.map((item) => {
            if (item.chatId === chat.chatId) {
                return { ...item, isSeen: true };
            }
            return item;
        });

        setChats(updatedChats);

        const userChats = updatedChats.map((item) => {
            const { user, ...rest } = item;
            return rest;
        });

        const userChatsRef = doc(db, "userchats", currentUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: userChats,
            });
            changeChat(chat.chatId, chat.user);
            if (setMobileView) setMobileView("chat"); // Trigger conditional render on mobile
        } catch (err) {
            console.error("Firebase update failed:", err);
        }
    };

    // --- THE FIX IS HERE ---
    const filteredChat = chats.filter((c) => {
        // If the user document is missing, we skip it so the app doesn't die
        if (!c.user) return false;
        const searchInput = input.toLowerCase();
        return (
            (c.user.username && c.user.username.toLowerCase().includes(searchInput)) ||
            (c.user.fullName && c.user.fullName.toLowerCase().includes(searchInput))
        );
    });

    return (
        <div className="chatList">
            <div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="" />
                    <input type="text" placeholder="search..." onChange={(e) => setInput(e.target.value)} />
                </div>
                <div className="add" onClick={() => setAddMode(prev => !prev)}>
                    <img src={addMode ? "./minus.png" : "./plus.png"} alt="" />
                </div>
            </div>
            {filteredChat.map((chat) => (
                <div
                    className="item"
                    key={chat.chatId}
                    onClick={() => handleSelect(chat)}
                    style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}
                >
                    {/* Optional chaining ?. ensures we don't crash on render */}
                    <img src={chat.user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{chat.user?.fullName || chat.user?.username || "Deleted User"}</span>
                        <p>{chat.lastMessage}</p>
                    </div>
                </div>
            ))}
            {addMode && <AddUser onClose={() => setAddMode(false)} />}
        </div>
    )
}

export default Chatlist;