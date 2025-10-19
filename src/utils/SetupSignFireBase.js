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

export const listenStatus = (roomChats, callback) => { // ĐÃ XÓA receiverId khỏi tham số
    if (!roomChats) return () => { };

    const q = query(
        collection(db, "signal", roomChats, "signal"),
        // Đã loại bỏ điều kiện where("receiverId", "==", receiverId)
        where("type", "==", "status"),
        orderBy("timestamp", "desc"),
        limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const signal = { id: doc.id, ...doc.data() };
            callback(signal);
        } else {
            callback(null);
        }
    });

    return unsub;
};

export const listenStatusByReceiver = (receiverUid, callback) => {
    if (!receiverUid) return () => {};

    const q = query(
        collectionGroup(db, "signal"),
        where("receiverId", "==", receiverUid),
        where("type", "==", "status"),
        orderBy("timestamp", "desc"),
        limit(20) // Lấy 20 signals gần nhất
    );

    const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
                const signal = { id: change.doc.id, ...change.doc.data() };
                callback(signal);
            }
        });
    });

    return unsub;
};