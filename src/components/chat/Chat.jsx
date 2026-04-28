import { useEffect, useState, useRef } from "react"
import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useChatStore } from "../../lib/chatStore"
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/cloudinary"

const Chat = ({ setMobileView, showBackButton = true, showInfoButton = true }) => {

    const [chat, setChat] = useState()
    const [open, setOpen] = useState(false)
    const [text, setText] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [attachments, setAttachments] = useState([]);

    const { currentUser } = useUserStore()
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore()

    const endRef = useRef(null)
    const textareaRef = useRef(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chat?.messages])

    // Auto-grow textarea like WhatsApp
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
        }
    }, [text])

    useEffect(() => {
        if (!chatId) return;

        const unSub = onSnapshot(
            doc(db, "chats", chatId),
            (res) => {
                setChat(res.data())
            }
        )
        return () => {
            unSub()
        }
    }, [chatId])

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji)
    }

    const handleFile = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => {
            const isImg = file.type.startsWith("image/");
            return {
                file: file,
                url: isImg ? URL.createObjectURL(file) : "",
                type: isImg ? "image" : "file",
                name: file.name
            };
        });
        setAttachments(prev => [...prev, ...newAttachments]);
        e.target.value = null; // allow selecting the same file again
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((text === "" && attachments.length === 0) || isSending) return;

        const currentText = text;
        const currentAttachments = [...attachments];

        setIsSending(true);

        // Instantly clear inputs for immediate UI feedback
        setAttachments([]);
        setText("");

        try {
            // Upload all files in parallel
            const uploadPromises = currentAttachments.map(async (att) => {
                const url = await upload(att.file);
                return { ...att, url };
            });
            const uploadedFiles = await Promise.all(uploadPromises);

            const newMessages = [];
            
            // Add image/file bubbles first
            uploadedFiles.forEach((file, index) => {
                newMessages.push({
                    senderId: currentUser.id,
                    createdAt: new Date(Date.now() + index), // Add slight delay to order correctly
                    fileUrl: file.url,
                    fileType: file.type,
                    fileName: file.name
                });
            });

            // Add text bubble last
            if (currentText) {
                newMessages.push({
                    senderId: currentUser.id,
                    text: currentText,
                    createdAt: new Date(Date.now() + uploadedFiles.length)
                });
            }

            // 1. Update the actual chat document
            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion(...newMessages)
            });

            const userIds = [currentUser.id, user.id];

            // 2. Update the sidebar/chat list for both users
            for (const id of userIds) {
                const userChatsRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatsRef);

                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();

                    const chatIndex = userChatsData.chats.findIndex(
                        (c) => c.chatId === chatId
                    );

                    if (chatIndex !== -1) {
                        let lastMsgText = currentText;
                        if (!currentText && currentAttachments.length > 0) {
                            if (currentAttachments.length === 1) {
                                lastMsgText = currentAttachments[0].type === "image" ? "📷 Image" : `📁 ${currentAttachments[0].name}`;
                            } else {
                                lastMsgText = `📸 ${currentAttachments.length} files`;
                            }
                        }

                        userChatsData.chats[chatIndex].lastMessage = lastMsgText;
                        userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
                        userChatsData.chats[chatIndex].updatedAt = Date.now();

                        await updateDoc(userChatsRef, {
                            chats: userChatsData.chats,
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            // Optional: If it failed, put the user's text back in case they want to retry
            setText(currentText);
            setAttachments(currentAttachments);
        } finally {
            setIsSending(false);
        }
    };


    if (!chatId) {
        return (
            <div className="chat chat-empty">
                <p className="chat-empty-text">Select a chat to start messaging.</p>
            </div>
        );
    }

    return (
        <div className="chat">
            <div className="top">
                {/* Back button on the far left */}
                {showBackButton && (
                    <button className="mobileBackButton" onClick={() => setMobileView && setMobileView("list")}>
                        <i className="fa-solid fa-arrow-left-long" style={{ color: "var(--text-dark)" }}></i>
                    </button>
                )}

                {/* User info in the center */}
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user?.fullName || user?.username}</span>
                    </div>
                </div>

                {/* Info button on the far right */}
                {showInfoButton && (
                    <button className="mobileInfoButton" onClick={() => setMobileView && setMobileView("detail")}>
                        ⋮
                    </button>
                )}
            </div>

            <div className="center">
                {chat?.messages?.map((message) => (
                    <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message?.createdAt}>
                        <div className="texts">
                            {message.fileUrl && (
                                message.fileType === "image" ? (
                                    <img src={message.fileUrl} alt="" />
                                ) : (
                                    <a href={message.fileUrl} target="_blank" rel="noreferrer" className="file-attachment">
                                        <div className={`file-attachment-card ${message.senderId === currentUser?.id ? "own" : "other"}`}>
                                            <div className="file-icon-box">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg>
                                            </div>
                                            <div className="file-info">
                                                <span className="file-name">
                                                    {message.fileName || "Download File"}
                                                </span>
                                                <span className="file-subtext">Click to open file</span>
                                            </div>
                                        </div>
                                    </a>
                                )
                            )}
                            {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
                <div ref={endRef}></div>
            </div>

            {attachments.length > 0 && !isSending && (
                <div className="attachmentsPreviewContainer">
                    {attachments.map((att, index) => (
                        <div className="previewItem" key={index}>
                            {att.type === "image" ? (
                                <img src={att.url} alt="preview" className="previewItemImg" />
                            ) : (
                                <div className="filePreviewBox">
                                    <img src="./file-solid-full.svg" alt="file" />
                                    <span className="fileName">{att.name}</span>
                                </div>
                            )}
                            <button className="removeImg" onClick={() => removeAttachment(index)}>✕</button>
                        </div>
                    ))}
                </div>
            )}
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file" title="Share files and pictures">
                        <img src="./img.png" alt="" />
                    </label>
                    <input type="file" id="file" className="hidden-file-input" multiple onChange={handleFile} disabled={isSending} />
                </div>
                <textarea
                    ref={textareaRef}
                    className="messageInput"
                    placeholder="Type a Message..."
                    value={text}
                    rows={1}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={isCurrentUserBlocked || isReceiverBlocked || isSending}
                />
                <div className="emoji">
                    <div className="emojiToggleIcon" onClick={() => setOpen((prev) => !prev)}>🙂</div>
                    <div className="picker">
                        <EmojiPicker open={open} onEmojiClick={handleEmoji} theme="dark" width={250} height={350} />
                    </div>

                </div>

                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked || isSending}>
                    {isSending ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    )
}

export default Chat;