import { arrayRemove, arrayUnion, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css"

const Detail = ({ setMobileView }) => {
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore()

    const { currentUser } = useUserStore();
    const [chatMessages, setChatMessages] = useState([]);

    useEffect(() => {
        if (!chatId) return;

        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            const data = res.data();
            if (data?.messages) {
                setChatMessages(data.messages);
            }
        });

        return () => {
            unSub();
        };
    }, [chatId]);

    // Reverse arrays so the newest (last sent) appear at the very top of the scrollable lists
    const sharedImages = chatMessages.filter((m) => m.fileUrl && m.fileType === "image").reverse();
    const sharedFiles = chatMessages.filter((m) => m.fileUrl && m.fileType !== "image").reverse();

    const handleBlock = async () => {
        if (!user || isCurrentUserBlocked) return

        const userDocRef = doc(db, "users", currentUser.id)

        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            })
            changeBlock()
        }
        catch (err) {
            console.log(err)
        }

    }
    return (
        <div className="detail">
            {/* Header with Mobile Back Button - hidden on desktop via CSS */}
            <div className="detailHeader">
                <button className="mobileBackButton" onClick={() => setMobileView && setMobileView("chat")}>
                    <i className="fa-solid fa-arrow-left-long fa-xl" style={{ color: "var(--text-dark)" }}></i>
                </button>
            </div>

            <div className="user">
                <div className="userTopRow">
                    <div className="avatarWrapper">
                        <img src={user?.avatar || "./avatar.png"} alt="" />
                        <div className="avatarBadge"></div>
                    </div>

                    <div className="userNameBox">
                        <h2>{user?.fullName || user?.username}</h2>

                        {user?.fullName && (
                            <span className="userTag">
                                @{user.username}
                            </span>
                        )}
                    </div>
                </div>

                <p className="userBio">
                    {user?.bio || "No bio available"}
                </p>
            </div>

            <div className="info scrollableInfo">

                {/* Shared Images Gallery */}
                <div className="shared-images">
                    <h3>Shared Photos</h3>
                    <div className="imageGrid">
                        {sharedImages.length > 0 ? sharedImages.map((msg, idx) => (
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" key={idx}>
                                <img src={msg.fileUrl} alt="Shared Media" className={msg.senderId === currentUser?.id ? "mediaOwn" : "mediaOther"} />
                            </a>
                        )) : (
                            <p className="noMedia">No photos shared yet.</p>
                        )}
                    </div>
                </div>

                {/* Shared Files List */}
                <div className="shared-files">
                    <h3>Shared Files</h3>
                    <div className="fileList">
                        {sharedFiles.length > 0 ? sharedFiles.map((msg, idx) => (
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" key={idx} className={`fileItem ${msg.senderId === currentUser?.id ? "mediaOwn" : "mediaOther"}`}>
                                <span className="fileIcon">📄</span>
                                <span className="fileName">
                                    {msg.fileName || "Download File"}
                                </span>
                            </a>
                        )) : (
                            <p className="noMedia">No files shared yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="info detailBottom">
                <div className="buttons">
                    <button onClick={handleBlock} disabled={isCurrentUserBlocked}>
                        {isCurrentUserBlocked ? "You Are Blocked" : isReceiverBlocked ? "User Blocked" : "Block User"}
                    </button>
                    <button className="logout" onClick={() => auth.signOut()}>Log Out</button>
                </div>
            </div>
        </div>
    )
}

export default Detail;