import { arrayUnion, collection, doc, getDocs, getDoc, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore"
import "./addUser.css"
import { useState } from "react"
import { db } from "../../../../lib/firebase"
import { useUserStore } from "../../../../lib/userStore"
const AddUser = ({ onClose }) => {

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [isAdding, setIsAdding] = useState(false)

    const { currentUser } = useUserStore()


    const handleSearch = async (e) => {
        e.preventDefault()

        const formData = new FormData(e.target)
        const name = formData.get("name")

        performSearch(name)
    }

    const performSearch = async (name) => {
        if (!name.trim()) {
            setUsers([])
            return
        }

        setLoading(true)

        try {
            const userRef = collection(db, "users")
            const querySnapShot = await getDocs(userRef)

            const searchTerm = name.toLowerCase()

            const foundUsers = querySnapShot.docs
                .map(doc => doc.data())
                .filter(user =>
                    user.id !== currentUser.id &&
                    (
                        (user.username && user.username.toLowerCase().includes(searchTerm)) ||
                        (user.fullName && user.fullName.toLowerCase().includes(searchTerm))
                    )
                )

            setUsers(foundUsers)
        } catch (err) {
            console.log(err.message)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const name = e.target.value
        performSearch(name)
    }


    const handleAdd = async (selectedUser) => {
        if (isAdding) return;
        setIsAdding(true);

        const chatRef = collection(db, "chats")
        const userChatsRef = collection(db, "userchats")

        try {
            // Check if chat already exists between these users
            const currentUserChatsDoc = await getDoc(doc(db, "userchats", currentUser.id))

            if (currentUserChatsDoc.exists()) {
                const userChatsData = currentUserChatsDoc.data()
                const chatExists = userChatsData.chats?.some(chat => chat.receiverId === selectedUser.id)

                if (chatExists) {
                    alert("Chat already exists with this user!")
                    return
                }
            }

            const newChatRef = doc(chatRef)
            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: [],
            })

            // Check if selectedUser's userchats document exists
            const selectedUserChatsDoc = await getDoc(doc(db, "userchats", selectedUser.id))

            if (selectedUserChatsDoc.exists()) {
                // Document exists, update it
                await updateDoc(doc(userChatsRef, selectedUser.id), {
                    chats: arrayUnion({
                        chatId: newChatRef.id,
                        lastMessage: "",
                        receiverId: currentUser.id,
                        updatedAt: Date.now(),
                    })
                })
            } else {
                // Document doesn't exist, create it
                await setDoc(doc(userChatsRef, selectedUser.id), {
                    chats: [{
                        chatId: newChatRef.id,
                        lastMessage: "",
                        receiverId: currentUser.id,
                        updatedAt: Date.now(),
                    }]
                })
            }

            // Check if currentUser's userchats document exists
            const currentUserChatsDocCheck = await getDoc(doc(db, "userchats", currentUser.id))

            if (currentUserChatsDocCheck.exists()) {
                // Document exists, update it
                await updateDoc(doc(userChatsRef, currentUser.id), {
                    chats: arrayUnion({
                        chatId: newChatRef.id,
                        lastMessage: "",
                        receiverId: selectedUser.id,
                        updatedAt: Date.now(),
                    })
                })
            } else {
                // Document doesn't exist, create it
                await setDoc(doc(userChatsRef, currentUser.id), {
                    chats: [{
                        chatId: newChatRef.id,
                        lastMessage: "",
                        receiverId: selectedUser.id,
                        updatedAt: Date.now(),
                    }]
                })
            }

            setUsers([])
            console.log("Chat created with ID:", newChatRef.id)
            if (onClose) onClose()

        } catch (err) {
            console.error("Error adding chat:", err)
            alert("Error: " + err.message)
        } finally {
            setIsAdding(false)
        }

    }


    return (
        <div className="adduser">
            <h3 style={{ textAlign: "center", paddingBottom: "20px" }}>Search and Add User</h3>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Username or Full Name"
                    name="name"
                    onChange={handleInputChange}
                />
                <button disabled={loading}>{loading ? "Searching..." : "Search"}</button>
            </form>
            {users.length > 0 && (
                <div className="user-list">
                    {users.map(user => (
                        <div key={user.id} className="user">
                            <div className="detail">
                                <img src={user.avatar || "./avatar.png"} alt="" />
                                <span>{user.username} {user.fullName ? `(${user.fullName})` : ""}</span>
                            </div>
                            <button disabled={isAdding} onClick={() => handleAdd(user)}>
                                {isAdding ? "Adding..." : "Add"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AddUser