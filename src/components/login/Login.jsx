import { useState } from "react"
import { toast } from "react-toastify";
import "./login.css"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../../lib/cloudinary";

const Login = () => {


    const [avatar, setAvatar] = useState({
        file: null,
        url: "",
    })

    const [loading, setLoading] = useState(false);
    const [isLoginView, setIsLoginView] = useState(false);


    const handleAvatar = (e) => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            })
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.target)

        const { username, email, password, fullName, bio } = Object.fromEntries(formData.entries())


        try {
            const res = await createUserWithEmailAndPassword(auth, email, password)

            let imgUrl = "";

            if (avatar.file) {
                toast.info("Uploading image... hang tight!");
                imgUrl = await upload(avatar.file);
            }

            await setDoc(doc(db, "users", res.user.uid), {
                username,
                fullName,
                bio,
                email,
                id: res.user.uid,
                avatar: imgUrl,
                blocked: [],
            })

            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: []
            })

            console.log("User document created successfully");
            toast.success("Account created! You can Login now!")

        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }



    }



    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.target)

        const { identifier, password } = Object.fromEntries(formData.entries())

        try {
            let email = identifier;

            // Check if the identifier is an email. If not, treat it as a username.
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
            if (!isEmail) {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", identifier));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    toast.error("Username not found!");
                    setLoading(false);
                    return;
                }

                // If found, leverage the linked email for Auth
                const userDoc = querySnapshot.docs[0].data();
                email = userDoc.email;
            }

            await signInWithEmailAndPassword(auth, email, password)

        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }



    }

    return (
        <div className="login">
            {/* Landing Info Panel */}
            <div className="intro-panel">
                <div className="brand-logo">
                    <h1><span style={{ color: "var(--primary)" }}>nocap</span> chat</h1>
                </div>
                <div className="intro-content">
                    <h2>Connect Instantly & Connect Freely. <br />No Subscriptions. <br /><span className="highlight"> No Cap.</span></h2>
                    <ul className="feature-list">
                        <li>
                            <span className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            </span>
                            <div>
                                <strong>Rapid-Fire Messaging</strong>
                                <p>Send text messages in real-time without any lag or limitations. Fast, fluid, forever.</p>
                            </div>
                        </li>
                        <li>
                            <span className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            </span>
                            <div>
                                <strong>Share Media & Files</strong>
                                <p>Effortlessly drag, drop, and share high-res photos and files simultaneously.</p>
                            </div>
                        </li>
                        <li>
                            <span className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </span>
                            <div>
                                <strong>Secure & Private</strong>
                                <p>Next-gen authentication keeps your private conversations strictly private.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Form Toggle Panel */}
            <div className="form-panel">
                {isLoginView ? (
                    <div className="item form-box">
                        <h2>Welcome Back</h2>
                        <form onSubmit={handleLogin}>
                            <input type="text" placeholder="Email or Username" name="identifier" required />
                            <input type="password" placeholder="Password" name="password" required />
                            <button disabled={loading}> {loading ? "Loading" : "Log In"} </button>
                        </form>
                        <div className="toggle-auth">
                            <span className="toggle-text">Don't have an account?</span>
                            <button type="button" className="toggle-btn" onClick={() => setIsLoginView(false)} disabled={loading}>
                                Sign Up
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="item form-box">
                        <h2>Create an Account</h2>
                        <form onSubmit={handleRegister}>
                            <label htmlFor="file"><img src={avatar.url || "./avatar.png"} alt="Avatar" />Add Profile Image</label>
                            <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                            <input type="text" placeholder="Full Name" name="fullName" required />
                            <input type="text" placeholder="Username" name="username" required />
                            <input type="text" placeholder="Short Bio" name="bio" />
                            <input type="email" placeholder="Email" name="email" required />
                            <input type="password" placeholder="Password" name="password" required />
                            <button disabled={loading}> {loading ? "Loading" : "Sign Up"} </button>
                        </form>
                        <div className="toggle-auth">
                            <span className="toggle-text">Sign in to your account if you have one.</span>
                            <button type="button" className="toggle-btn" onClick={() => setIsLoginView(true)} disabled={loading}>
                                Log In
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Login