import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,

    changeChat: (chatId, user) => {
        const currentUser = useUserStore.getState().currentUser;

        // 1. CRITICAL GUARD: If user is null (deleted/not found), 
        // reset the chat state and GTFO.
        if (!user) {
            return set({
                chatId: null,
                user: null,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
            });
        }

        // 2. SAFETY CHECK: Ensure blocked arrays exist before calling .includes()
        const userBlockedList = user.blocked || [];
        const currentUserBlockedList = currentUser?.blocked || [];

        // Is current user blocked? 
        if (userBlockedList.includes(currentUser.id)) {
            return set({
                chatId,
                user: null,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
            });
        }

        // Is receiver blocked? 
        else if (currentUserBlockedList.includes(user.id)) {
            return set({
                chatId,
                user: user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: true,
            });
        }

        else {
            return set({
                chatId,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
            });
        }
    },

    changeBlock: () => {
        set(state => ({
            ...state,
            isReceiverBlocked: !state.isReceiverBlocked
        }));
    },

    // Add a reset function for when you want to clear the screen
    resetChat: () => {
        set({
            chatId: null,
            user: null,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
        });
    }
}));