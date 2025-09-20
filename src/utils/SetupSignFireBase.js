import { collection, addDoc, serverTimestamp, collectionGroup, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

// Gửi trạng thái (ví dụ: "Hủy lịch") vào Firestore theo roomChats
// Không thay đổi state cục bộ, chỉ ghi log tín hiệu vào Firestore
export const sendStatus = async (senderId, receiverId, statusText) => {
    if (!senderId || !receiverId) return;
    const text = (statusText || "").trim();
    if (!text) return;

    // Tạo roomChats ID ổn định từ 2 userId
    const roomChats = [senderId, receiverId].sort().join("_");

    try {
        await addDoc(collection(db, "signal", roomChats, "signal"), {
            senderId,
            receiverId,
            type: "status", // đánh dấu đây là thông điệp trạng thái
            status: text, // ví dụ: "Hủy lịch"
            timestamp: serverTimestamp(), // giữ tương thích với listener hiện tại
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("Error sending status:", err);
        throw err;
    }
};

export const listenStatus = (roomChats, receiverId, callback) => {
    if (!roomChats || !receiverId) return () => { };

    const q = query(
        collection(db, "signal", roomChats, "signal"),
        where("receiverId", "==", receiverId),
        where("type", "==", "status"),
        orderBy("timestamp", "desc"),
        limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
        const doc = snapshot.docs[0];
        if (!doc) return;
        callback(doc.data());
    }, (err) => {
        console.error("Firestore listener error:", err);
    });

    return unsub;
};
