import { doc, onSnapshot } from "firebase/firestore"; // Use onSnapshot for live updates
import { create } from "zustand";
import { db } from "./firebase";

export const useUserStore = create((set) => ({
    currentUser: null,
    isLoading: true,

    fetchUserInfo: (uid) => {
        console.log("fetchUserInfo called with uid:", uid);

        if (!uid) {
            return set({
                currentUser: null,
                isLoading: false,
            });
        }

        try {
            const docRef = doc(db, "users", uid);
            console.log("Listening to path: users/", uid);

            // Using onSnapshot keeps your logic but updates UI when bio/avatar changes
            const unsub = onSnapshot(docRef, (docSnap) => {
                console.log("Document exists:", docSnap.exists());

                if (docSnap.exists()) {
                    console.log("Document data updated:", docSnap.data());
                    set({
                        currentUser: { ...docSnap.data(), id: docSnap.id },
                        isLoading: false,
                    });
                    console.log("User set successfully");
                } else {
                    console.log("Document does not exist!");
                    set({
                        currentUser: null,
                        isLoading: false,
                    });
                }
            }, (err) => {
                console.error("Error in onSnapshot listener:", err);
                set({
                    currentUser: null,
                    isLoading: false,
                });
            });

            return unsub; // Returning the unsubscribe function
        } catch (err) {
            console.error("Error fetching user:", err);
            set({
                currentUser: null,
                isLoading: false,
            });
        }
    }
}));