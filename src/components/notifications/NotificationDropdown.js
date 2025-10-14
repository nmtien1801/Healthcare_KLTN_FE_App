import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { Bell, Check, Trash2 } from "lucide-react-native";
import ApiNotification from "../../apis/ApiNotification";
import { listenStatus, sendStatus } from "../../utils/SetupSignFireBase";
import { formatDate } from "../../utils/formatDate";

const NotificationDropdown = () => {
    const user = useSelector((state) => state.auth.userInfo);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    // Tạm thời hardcode uid bác sĩ & bệnh nhân
    const doctorHardcodeUid = "1HwseYsBwxby5YnsLUWYzvRtCw53";
    const patientHardcodeUid = "cq6SC0A1RZXdLwFE1TKGRJG8fgl2";
    const isDoctor = user.uid === doctorHardcodeUid;
    const doctorUid = isDoctor ? user.uid : doctorHardcodeUid;
    const patientUid = isDoctor ? patientHardcodeUid : user.uid;
    const roomChats = [doctorUid, patientUid].sort().join("_");

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await ApiNotification.getNotificationsByUser();
            if (res?.data) {
                const normalized = res.data.map((n) => ({ ...n, id: n.id || n._id }));
                setNotifications(normalized);
                setUnreadCount(normalized.filter((n) => !n.isRead).length);
            }
        } catch (err) {
            console.log("Lỗi load thông báo:", err);
        } finally {
            setLoading(false);
        }
    };
    // Load số lượng thông báo chưa đọc
    const loadUnreadCount = async () => {
        try {
            const res = await ApiNotification.getUnreadCount();
            setUnreadCount(res?.data?.unreadCount || 0);
        } catch (error) {
            console.error("Lỗi khi load số lượng chưa đọc:", error);
        }
    };


    const handleMarkAsRead = async (id) => {
        try {
            await ApiNotification.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(prev - 1, 0));
            sendStatus(doctorUid, patientUid, "notification_update");
        } catch (err) {
            console.log("Lỗi đánh dấu đã đọc:", err);
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await ApiNotification.deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            sendStatus(doctorUid, patientUid, "notification_delete");
        } catch (err) {
            console.log("Lỗi xóa:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await ApiNotification.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            sendStatus(doctorUid, patientUid, "notification_read_all");
        } catch (err) {
            console.log("Lỗi đánh dấu tất cả:", err);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "system":
                return "🔔";
            case "reminder":
                return "⏰";
            case "message":
                return "💬";
            case "alert":
                return "⚠️";
            default:
                return "🔔";
        }
    };

    // Lắng nghe realtime Firestore
    useEffect(() => {
        if (!user?.uid) return;

        // Load ban đầu
        loadNotifications();
        loadUnreadCount();

        const unsub = listenStatus(roomChats, async (signal) => {
            if (!signal) return;

            try {
                // Nếu chỉ là cập nhật, xóa hoặc đánh dấu đọc → reload mà không hiện toast
                if (
                    typeof signal === "string" &&
                    ["notification_update", "notification_delete", "notification_read_all"].includes(signal)
                ) {
                    await Promise.all([loadNotifications(), loadUnreadCount()]);
                    return;
                }

                // Ngược lại, nếu là tín hiệu mới thực sự → load và hiện toast
                const res = await ApiNotification.getNotificationsByUser();
                if (res?.data?.length > 0) {
                    const normalized = res.data.map((n) => ({
                        ...n,
                        id: n.id || n._id,
                    }));
                    setNotifications(normalized);
                    setUnreadCount(normalized.filter((n) => !n.isRead).length);

                    const latest = res.data[0];
                    if (!latest.isRead) {
                        Toast.show({
                            type: "success",
                            text1: latest.title,
                            text2: latest.content,
                        });
                    }
                }
            } catch (err) {
                console.error("Lỗi khi load thông báo realtime:", err);
            }
        });

        return () => unsub();
    }, [user?.uid]);

    return (
        <View style={{ marginRight: 10 }}>
            <TouchableOpacity onPress={() => setShowAll(true)} style={styles.bellContainer}>
                <Bell size={26} color="#333" />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Modal xem tất cả */}
            <Modal visible={showAll} animationType="slide" onRequestClose={() => setShowAll(false)}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Tất cả thông báo</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#007bff" />
                    ) : notifications.length === 0 ? (
                        <Text style={styles.noNotifText}>Không có thông báo nào</Text>
                    ) : (
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View
                                    style={[
                                        styles.notificationItem,
                                        !item.isRead && styles.unreadItem,
                                    ]}
                                >
                                    {item.avatar ? (
                                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.defaultAvatar}>
                                            <Text style={{ color: "#fff" }}>{getNotificationIcon(item.type)}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.title}>{item.title}</Text>
                                        <Text style={styles.content}>{item.content}</Text>
                                        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                                    </View>
                                    <View style={styles.actions}>
                                        {!item.isRead && (
                                            <TouchableOpacity onPress={() => handleMarkAsRead(item.id)}>
                                                <Check size={18} color="#007bff" />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => handleDeleteNotification(item.id)}>
                                            <Trash2 size={18} color="#dc3545" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                    {unreadCount > 0 && (
                        <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllAsRead}>
                            <Text style={styles.readAllText}>Đánh dấu tất cả đã đọc</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAll(false)}>
                        <Text style={styles.closeText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <Toast />
        </View>
    );
};

export default NotificationDropdown;

const styles = StyleSheet.create({
    bellContainer: {
        position: "relative",
        padding: 6,
    },
    badge: {
        position: "absolute",
        right: 0,
        top: 0,
        backgroundColor: "#dc3545",
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    badgeText: { color: "#fff", fontSize: 10 },
    modalContainer: { flex: 1, padding: 16, backgroundColor: "#fff" },
    modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
    notificationItem: {
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderColor: "#eee",
        alignItems: "center",
    },
    unreadItem: { backgroundColor: "#e3f2fd" },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    defaultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#999",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    title: { fontWeight: "600", fontSize: 14 },
    content: { color: "#555", fontSize: 12 },
    date: { color: "#999", fontSize: 11 },
    actions: { flexDirection: "row", gap: 10, marginLeft: 5 },
    readAllBtn: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    readAllText: { color: "#fff", textAlign: "center" },
    closeBtn: {
        backgroundColor: "#ccc",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    closeText: { color: "#333", textAlign: "center" },
    noNotifText: { textAlign: "center", marginTop: 50, color: "#666" },
});
