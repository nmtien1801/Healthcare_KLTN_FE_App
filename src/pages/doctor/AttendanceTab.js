import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    TextInput,
    ScrollView,
    Dimensions,
    Modal,
    SafeAreaView,
} from 'react-native';
import { useSelector } from "react-redux";
import {
    Pencil,
    X,
    Calendar,
    Clock,
    List,
    Info,
    PlusCircle,
    Trash2,
    Shield,
    Award,
} from 'lucide-react-native';
// 
import ApiWorkShift from "../../apis/ApiWorkShift";
import ApiDoctor from "../../apis/ApiDoctor";
import { formatDate } from "../../utils/formatDate";
import { listenStatusByReceiver, sendStatus } from "../../utils/SetupSignFireBase";


// Shift options
const shiftOptions = [
    { key: "morning", label: "Sáng (08:00 - 12:30)", start: "08:00", end: "12:30" },
    { key: "afternoon", label: "Chiều (13:00 - 17:00)", start: "13:00", end: "17:00" },
    { key: "evening", label: "Tối (18:00 - 21:00)", start: "18:00", end: "21:00" },
];

// Work type options
const workTypeOptions = [
    { key: "fulltime", label: "Full Time", description: "Làm việc toàn thời gian" },
    { key: "parttime", label: "Part Time", description: "Làm việc bán thời gian" },
];

// Weekday options
const weekdays = [
    { label: "Thứ 2", key: "monday" },
    { label: "Thứ 3", key: "tuesday" },
    { label: "Thứ 4", key: "wednesday" },
    { label: "Thứ 5", key: "thursday" },
    { label: "Thứ 6", key: "friday" },
    { label: "Thứ 7", key: "saturday" },
    { label: "Chủ nhật", key: "sunday" },
];

// Hàm tính ngày thứ Hai của tuần hiện tại
const getCurrentWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + offset);
    return monday.toISOString().split("T")[0];
};

// Schedule Form Modal
const ScheduleFormModal = ({
    show,
    onClose,
    weekStartDate,
    handleWeekStartChange,
    handleSelectCurrentWeek,
    weeklySchedule,
    handleShiftToggle,
    isEditing,
    resetScheduleForm,
    handleSaveOrUpdateSchedule,
    workType,
    handleWorkTypeChange,
}) => (
    <Modal
        visible={show}
        animationType="slide"
        transparent={true}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Pencil size={24} color="#007bff" />
                    <Text style={styles.modalTitle}>
                        {isEditing ? 'Cập nhật lịch làm việc' : 'Đăng ký lịch làm việc'}
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={true}
                >
                    {/* Chọn ngày bắt đầu tuần */}
                    <Text style={styles.formLabel}>Chọn tuần bắt đầu</Text>
                    <View style={styles.datePickerContainer}>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD (VD: 2025-09-22)"
                            value={weekStartDate}
                            onChangeText={(text) => handleWeekStartChange({ target: { value: text } })}
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.currentWeekButton} onPress={handleSelectCurrentWeek}>
                            <Calendar size={20} color="#fff" />
                            <Text style={styles.buttonText}>Tuần hiện tại</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Chọn loại hình làm việc */}
                    <Text style={styles.formLabel}>Loại hình làm việc</Text>
                    <View style={styles.workTypeContainer}>
                        {workTypeOptions.map((type) => (
                            <TouchableOpacity
                                key={type.key}
                                style={[
                                    styles.workTypeButton,
                                    workType === type.key ? styles.workTypeSelected : null,
                                ]}
                                onPress={() => handleWorkTypeChange(type.key)}
                            >
                                <Text style={[
                                    styles.workTypeText,
                                    workType === type.key ? styles.workTypeTextSelected : null,
                                ]}>
                                    {type.label}
                                </Text>
                                <Text style={styles.workTypeDescription}>{type.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Chọn ca làm việc */}
                    <Text style={[styles.formLabel, styles.centered]}>Chọn ca làm việc</Text>
                    <View style={styles.weekGrid}>
                        {weekdays.map((day) => (
                            <View key={day.key} style={styles.dayCard}>
                                <Text style={styles.dayLabel}>{day.label}</Text>
                                <View style={styles.shiftGrid}>
                                    {shiftOptions.map((shift) => (
                                        <TouchableOpacity
                                            key={shift.key}
                                            onPress={() => handleShiftToggle(day.key, shift.key)}
                                            style={[
                                                styles.shiftButton,
                                                weeklySchedule[day.key]?.includes(shift.key) && styles.shiftButtonSelected,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.shiftButtonText,
                                                    weeklySchedule[day.key]?.includes(shift.key) && styles.shiftButtonTextSelected,
                                                ]}
                                            >
                                                {shift.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => {
                        resetScheduleForm();
                        onClose();
                    }}>
                        <Text style={styles.buttonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                            handleSaveOrUpdateSchedule();
                            onClose();
                        }}
                    >
                        <Text style={styles.buttonText}>{isEditing ? 'Cập nhật' : 'Lưu'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

// Confirmation Modal
const ConfirmationModal = ({ show, title, message, onConfirm, onCancel }) => (
    <Modal
        visible={show}
        animationType="fade"
        transparent={true}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalBodyText}>{message}</Text>
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.buttonText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                        <Text style={styles.buttonText}>Xác nhận xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

// Info Modal
const InfoModal = ({ show, title, message, onClose }) => (
    <Modal
        visible={show}
        animationType="fade"
        transparent={true}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContentNotifications}>
                <View style={styles.modalHeader}>
                    <Info size={24} color="#007bff" />
                    <Text style={styles.modalTitle}>{title}</Text>
                </View>
                <Text style={styles.modalBodyText}>{message}</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                    <Text style={styles.buttonText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

// Saved Schedules Modal
const SavedSchedulesModal = ({
    show,
    onClose,
    savedSchedules,
    formatDate,
    handleEditSchedule,
    handleDeleteSchedule,
}) => (
    <Modal
        visible={show}
        animationType="slide"
        transparent={true}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <List size={24} color="#007bff" />
                    <Text style={styles.modalTitle}>Lịch làm việc đã lưu</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                    {savedSchedules.length === 0 ? (
                        <View style={styles.alertInfo}>
                            <Text style={styles.alertText}>Chưa có lịch làm việc nào được lưu.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={savedSchedules}
                            keyExtractor={(item) => item.weekStartDate}
                            renderItem={({ item }) => (
                                <View style={styles.scheduleItem}>
                                    <Text style={styles.scheduleText}>Tuần bắt đầu: {formatDate(item.weekStartDate)}</Text>
                                    <Text style={styles.scheduleText}>Loại hình: {workTypeOptions.find((wt) => wt.key === item.workType)?.label || "-"}</Text>
                                    <View>
                                        {Object.entries(item.schedule).map(([dayKey, shifts]) => (
                                            <View key={dayKey} style={styles.scheduleDay}>
                                                <Text style={styles.scheduleDayLabel}>
                                                    {weekdays.find((d) => d.key === dayKey)?.label}:
                                                </Text>
                                                {shifts.length === 0 ? (
                                                    <Text style={styles.scheduleNoShift}>Không có ca</Text>
                                                ) : (
                                                    shifts.map((shift, index) => (
                                                        <Text key={`${dayKey}-${shift}-${index}`} style={styles.scheduleShift}>
                                                            {shiftOptions.find((s) => s.key === shift)?.label}
                                                        </Text>
                                                    ))
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                    <View style={styles.scheduleActions}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => {
                                                onClose();
                                                handleEditSchedule(item);
                                            }}
                                        >
                                            <Pencil size={16} color="#007bff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteSchedule(item.weekStartDate)}
                                        >
                                            <Trash2 size={16} color="#dc3545" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </ScrollView>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.buttonText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

// CurrentSchedule component
const CurrentSchedule = ({ currentShift, doctorInfo, loadingDoctor }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Calendar size={24} color="#007bff" />
                <Text style={styles.headerTitle}>Lịch làm việc hiện tại</Text>
            </View>
            <View style={styles.cardBody}>
                {loadingDoctor ? (
                    <Text style={styles.loadingText}>Đang tải...</Text>
                ) : (
                    <View style={styles.doctorInfo}>
                        <Image
                            source={{ uri: doctorInfo?.avatar || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face" }}
                            style={styles.doctorAvatar}
                        />
                        <View style={styles.doctorInfoText}>
                            <Text style={styles.doctorName}>{doctorInfo?.username || "Bác sĩ không xác định"}</Text>
                            <Text style={styles.doctorSpecialty}>{doctorInfo?.specialty || "Chuyên khoa nội tiết"}</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Online</Text>
                        </View>
                    </View>
                )}
                <View style={styles.scheduleDetails}>
                    <View style={styles.detailItem}>
                        <Calendar size={18} color="#007bff" />
                        <Text style={styles.detailText}>
                            {currentShift ? formatDate(currentShift.date) : "Không có ca làm việc hôm nay"}
                        </Text>
                    </View>
                    {currentShift && (
                        <View style={styles.detailItem}>
                            <Clock size={18} color="#007bff" />
                            <Text style={styles.detailText}>{`${currentShift.start} - ${currentShift.end}`}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIcon, { backgroundColor: '#e8f5e8' }]}>
                            <Shield size={20} color="#28a745" />
                        </View>
                        <Text style={styles.featureText}>Bảo mật 100%</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIcon, { backgroundColor: '#fff3cd' }]}>
                            <Award size={20} color="#ffc107" />
                        </View>
                        <Text style={styles.featureText}>Bác sĩ chuyên nghiệp</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIcon, { backgroundColor: '#cce7ff' }]}>
                            <Clock size={20} color="#007bff" />
                        </View>
                        <Text style={styles.featureText}>Hỗ trợ 24/7</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// AttendanceTab component (main component)
const AttendanceTab = () => {
    const [savedSchedules, setSavedSchedules] = useState([]);
    const [currentShift, setCurrentShift] = useState(null);
    const [checkInTime, setCheckInTime] = useState(null);
    const [checkOutTime, setCheckOutTime] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoModalMessage, setInfoModalMessage] = useState("");
    const [infoModalTitle, setInfoModalTitle] = useState("");
    const [showScheduleFormModal, setShowScheduleFormModal] = useState(false);
    const [showSavedSchedulesModal, setShowSavedSchedulesModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [filterType, setFilterType] = useState("week");
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
    const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStart());
    const [weeklySchedule, setWeeklySchedule] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [workType, setWorkType] = useState("parttime");
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [loadingDoctor, setLoadingDoctor] = useState(true);
    const user = useSelector((state) => state.auth.user);
    const [receiverId, setReceiverId] = useState();
    const senderId = user.uid;
    const roomChats = [senderId, receiverId].sort().join("_");

    useEffect(() => {

        const unsub = listenStatusByReceiver(senderId, async (signal) => {
            if (!signal) return;
            if (["createWorkShifts", "deleteManyWorkShifts", "checkInWorkShift", "checkOutWorkShift"].includes(signal.status)) {
                try {
                    await fetchDoctorInfo();
                    await fetchShifts();

                } catch (error) {
                    console.error("Error syncing on signal:", error);
                }
            }
        })
        const fetchDoctorInfo = async () => {
            if (!senderId) {
                setInfoModalTitle("Thông báo");
                setInfoModalMessage("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
                setShowInfoModal(true);
                setLoadingDoctor(false);
                return;
            }

            try {
                setLoadingDoctor(true);
                const response = await ApiDoctor.getDoctorInfo();
                setDoctorInfo({
                    username: response.userId?.username || "Bác sĩ không xác định",
                    hospital: response.hospital || "Bệnh viện không xác định",
                    avatar: response.userId?.avatar || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face",
                    experience: response.exp || 0,
                });
            } catch (error) {
                console.error("Error fetching doctor info:", error);
                setInfoModalTitle("Thông báo");
                setInfoModalMessage(`${error.message}`);
                setShowInfoModal(true);
                setDoctorInfo({
                    username: user?.username || "Bác sĩ không xác định",
                    hospital: "Bệnh viện không xác định",
                    avatarUrl: user?.avatar || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face",
                    experience: 0,
                });
            } finally {
                setLoadingDoctor(false);
            }
        };

        fetchDoctorInfo();
        const fetchShifts = async () => {
            try {
                const shifts = await ApiWorkShift.getWorkShiftsByDoctor();
                const groupedSchedules = {};
                shifts.forEach((shift) => {
                    const date = new Date(shift.date);
                    if (isNaN(date.getTime())) return;

                    const weekStart = new Date(date);
                    const day = date.getDay();
                    const offset = day === 0 ? -6 : 1 - day;
                    weekStart.setDate(date.getDate() + offset);
                    const weekStartStr = weekStart.toISOString().split("T")[0];

                    if (!groupedSchedules[weekStartStr]) {
                        groupedSchedules[weekStartStr] = {
                            shiftIds: [],
                            weekStartDate: weekStartStr,
                            schedule: {},
                            workType: shift.workType || "parttime",
                        };
                    }

                    groupedSchedules[weekStartStr].shiftIds.push(shift._id);

                    const weekday = weekdays[day === 0 ? 6 : day - 1].key;
                    const shiftKey = shiftOptions.find(
                        (option) => option.start === shift.start && option.end === shift.end
                    )?.key || "parttime";

                    if (!groupedSchedules[weekStartStr].schedule[weekday]) {
                        groupedSchedules[weekStartStr].schedule[weekday] = [];
                    }
                    groupedSchedules[weekStartStr].schedule[weekday].push(shiftKey);
                });

                setSavedSchedules(Object.values(groupedSchedules));

                const todayShifts = await ApiWorkShift.getTodayWorkShifts();
                const current = todayShifts.find(
                    (s) => !s.attendance.checkedIn || (s.attendance.checkedIn && !s.attendance.checkedOut)
                );
                setCurrentShift(current || null);

                const history = shifts
                    .filter((shift) => shift.attendance?.checkedIn)
                    .map((shift) => {
                        const checkInTime = shift.attendance.checkInTime || "-";
                        const checkOutTime = shift.attendance.checkOutTime || "-";
                        let status = "-";
                        if (checkInTime !== "-") {
                            const [inHour, inMinute] = checkInTime.split(":").map(Number);
                            const [startHour, startMinute] = shift.start.split(":").map(Number);

                            // So sánh với giờ bắt đầu ca làm
                            if (inHour < startHour || (inHour === startHour && inMinute <= startMinute)) {
                                status = "Đúng giờ";
                            } else {
                                status = "Đi trễ";
                            }

                            // Xét thêm trạng thái check-out
                            if (shift.attendance.checkedOut) {
                                status = checkOutTime !== "-" ? status : "Online";
                            }
                        }

                        return {
                            date: shift.date,
                            checkIn: checkInTime,
                            checkOut: checkOutTime,
                            status,
                        };
                    });
                setAttendanceHistory(history);
            } catch (error) {
                console.error("Error fetching shifts:", error);
                setInfoModalTitle("Thông báo");
                setInfoModalMessage(`${error.message}`);
                setShowInfoModal(true);
            }
        };

        if (!senderId) {
            setInfoModalTitle("Thông báo");
            setInfoModalMessage("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            setShowInfoModal(true);
            return;
        }

        fetchShifts();

        return () => {
            unsub(); // Cleanup listener
        };
    }, [user.uid, roomChats]);
    useEffect(() => {
        if (showScheduleFormModal) {
            const existingSchedule = savedSchedules.find((s) => s.weekStartDate === weekStartDate);
            if (existingSchedule) {
                setIsEditing(true);
                setWeeklySchedule(existingSchedule.schedule || {});
                setWorkType(existingSchedule.workType || "parttime");
            } else {
                setIsEditing(false);
                setWeeklySchedule({});
                setWorkType("parttime");
            }
        }
    }, [weekStartDate, showScheduleFormModal, savedSchedules]);

    const handleWeekStartChange = (e) => {
        const selectedDate = new Date(e.target.value);
        if (isNaN(selectedDate.getTime())) {
            setWeekStartDate(getCurrentWeekStart());
            return;
        }
        const day = selectedDate.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        const monday = new Date(selectedDate);
        monday.setDate(selectedDate.getDate() + offset);
        setWeekStartDate(monday.toISOString().split("T")[0]);
    };

    const handleSelectCurrentWeek = () => {
        setWeekStartDate(getCurrentWeekStart());
    };

    const handleShiftToggle = (dayKey, shiftKey) => {
        setWeeklySchedule((prev) => {
            const current = prev[dayKey] || [];
            const updated = current.includes(shiftKey)
                ? current.filter((s) => s !== shiftKey)
                : [...current, shiftKey];
            return { ...prev, [dayKey]: updated };
        });
    };

    const handleWorkTypeChange = (type) => {
        setWorkType(type);
        if (type === "fulltime") {
            const fullTimeSchedule = {};
            weekdays.forEach((day) => {
                fullTimeSchedule[day.key] = shiftOptions.map((shift) => shift.key);
            });
            setWeeklySchedule(fullTimeSchedule);
        } else {
            setWeeklySchedule({});
        }
    };

    const handleSaveOrUpdateSchedule = async () => {
        if (!weekStartDate) {
            setInfoModalTitle("Thông báo");
            setInfoModalMessage("Vui lòng chọn ngày bắt đầu tuần.");
            setShowInfoModal(true);
            return;
        }

        try {
            const shiftsData = [];
            Object.entries(weeklySchedule).forEach(([dayKey, shifts]) => {
                const dayIndex = weekdays.findIndex((d) => d.key === dayKey);
                if (dayIndex === -1 || !shifts.length) return;

                const date = new Date(weekStartDate);
                date.setDate(date.getDate() + dayIndex);

                shifts.forEach((shiftKey) => {
                    const shiftOption = shiftOptions.find((s) => s.key === shiftKey);
                    if (shiftOption) {
                        shiftsData.push({
                            date: date.toISOString().split("T")[0],
                            start: shiftOption.start,
                            end: shiftOption.end,
                            workType,
                        });
                    }
                });
            });

            if (shiftsData.length === 0) {
                setInfoModalTitle("Thông báo");
                setInfoModalMessage("Vui lòng chọn ít nhất một ca làm việc.");
                setShowInfoModal(true);
                return;
            }

            if (isEditing) {
                const editingSchedule = savedSchedules.find((s) => s.weekStartDate === weekStartDate);
                if (editingSchedule && editingSchedule.shiftIds.length > 0) {
                    await ApiWorkShift.deleteManyWorkShifts(editingSchedule.shiftIds);
                    sendStatus(senderId, receiverId, "deleteManyWorkShifts");
                }
                await ApiWorkShift.createWorkShifts({ shifts: shiftsData });
                sendStatus(senderId, receiverId, "createWorkShifts");
                setInfoModalTitle("Thành công");
                setInfoModalMessage("Lịch làm việc đã được cập nhật!");
                setIsEditing(false);
            } else {
                await ApiWorkShift.createWorkShifts({ shifts: shiftsData });
                sendStatus(senderId, receiverId, "createWorkShifts");
                setInfoModalTitle("Thành công");
                setInfoModalMessage("Lịch làm việc đã được lưu!");
            }

            setShowInfoModal(true);

            // Reload shifts
            const shifts = await ApiWorkShift.getWorkShiftsByDoctor();
            const groupedSchedules = {};
            shifts.forEach((shift) => {
                const date = new Date(shift.date);
                if (isNaN(date.getTime())) return;

                const weekStart = new Date(date);
                const day = date.getDay();
                const offset = day === 0 ? -6 : 1 - day;
                weekStart.setDate(date.getDate() + offset);
                const weekStartStr = weekStart.toISOString().split("T")[0];

                if (!groupedSchedules[weekStartStr]) {
                    groupedSchedules[weekStartStr] = {
                        shiftIds: [],
                        weekStartDate: weekStartStr,
                        schedule: {},
                        workType: shift.workType || "parttime",
                    };
                }

                groupedSchedules[weekStartStr].shiftIds.push(shift._id);

                const weekday = weekdays[day === 0 ? 6 : day - 1].key;
                const shiftKey = shiftOptions.find(
                    (option) => option.start === shift.start && option.end === shift.end
                )?.key;

                if (!groupedSchedules[weekStartStr].schedule[weekday]) {
                    groupedSchedules[weekStartStr].schedule[weekday] = [];
                }
                groupedSchedules[weekStartStr].schedule[weekday].push(shiftKey);
            });

            setSavedSchedules(Object.values(groupedSchedules));
            resetScheduleForm();
        } catch (error) {
            setInfoModalTitle("Thông báo");
            setInfoModalMessage(`${error.response?.data?.message || error.message}`);
            setShowInfoModal(true);
        }
    };

    const resetScheduleForm = () => {
        setWeekStartDate(getCurrentWeekStart());
        setWeeklySchedule({});
        setIsEditing(false);
        setWorkType("parttime");
    };

    const handleEditSchedule = (schedule) => {
        setIsEditing(true);
        setWeekStartDate(schedule.weekStartDate);
        setWeeklySchedule(schedule.schedule);
        setWorkType(schedule.workType || "parttime");
        setShowScheduleFormModal(true);
    };

    const handleDeleteSchedule = (weekStartDate) => {
        const schedule = savedSchedules.find((s) => s.weekStartDate === weekStartDate);
        if (schedule && schedule.shiftIds && schedule.shiftIds.length > 0) {
            setScheduleToDelete(schedule.shiftIds);
            setShowDeleteConfirmModal(true);
        } else {
            setInfoModalTitle("Thông báo");
            setInfoModalMessage("Không tìm thấy ca làm việc nào trong tuần này.");
            setShowInfoModal(true);
        }
    };

    const confirmDeleteSchedule = async () => {
        if (scheduleToDelete && scheduleToDelete.length > 0) {
            try {
                await ApiWorkShift.deleteManyWorkShifts(scheduleToDelete);
                sendStatus(senderId, receiverId, "deleteManyWorkShifts");
                setInfoModalTitle("Thành công");
                setInfoModalMessage("Lịch làm việc đã được xóa!");
                setShowInfoModal(true);

                // Reload shifts
                const shifts = await ApiWorkShift.getWorkShiftsByDoctor();
                const groupedSchedules = {};
                shifts.forEach((shift) => {
                    const date = new Date(shift.date);
                    if (isNaN(date.getTime())) return;

                    const weekStart = new Date(date);
                    const day = date.getDay();
                    const offset = day === 0 ? -6 : 1 - day;
                    weekStart.setDate(date.getDate() + offset);
                    const weekStartStr = weekStart.toISOString().split("T")[0];

                    if (!groupedSchedules[weekStartStr]) {
                        groupedSchedules[weekStartStr] = {
                            shiftIds: [],
                            weekStartDate: weekStartStr,
                            schedule: {},
                            workType: shift.workType || "parttime",
                        };
                    }

                    groupedSchedules[weekStartStr].shiftIds.push(shift._id);

                    const weekday = weekdays[day === 0 ? 6 : day - 1].key;
                    const shiftKey = shiftOptions.find(
                        (option) => option.start === shift.start && option.end === shift.end
                    )?.key;

                    if (!groupedSchedules[weekStartStr].schedule[weekday]) {
                        groupedSchedules[weekStartStr].schedule[weekday] = [];
                    }
                    groupedSchedules[weekStartStr].schedule[weekday].push(shiftKey);
                });

                setSavedSchedules(Object.values(groupedSchedules));
            } catch (error) {
                setInfoModalTitle("Thông báo");
                setInfoModalMessage(`${error.response?.data?.message || error.message}`);
                setShowInfoModal(true);
            }
        }
        setShowDeleteConfirmModal(false);
        setScheduleToDelete(null);
    };

    const cancelDeleteSchedule = () => {
        setShowDeleteConfirmModal(false);
        setScheduleToDelete(null);
    };

    const handleCheckIn = async () => {
        try {
            const now = new Date();
            const checkInTimeStr = now.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            });
            await ApiWorkShift.checkInWorkShift("webcam");
            sendStatus(senderId, receiverId, "checkInWorkShift");

            setCheckInTime(checkInTimeStr);
            setAttendanceHistory((prev) => {
                const todayDate = now.toISOString().split("T")[0];
                const existingEntryIndex = prev.findIndex((entry) => entry.date === todayDate);
                if (existingEntryIndex > -1) {
                    const updatedHistory = [...prev];
                    updatedHistory[existingEntryIndex] = {
                        ...updatedHistory[existingEntryIndex],
                        checkIn: checkInTimeStr,
                        checkOut: null,
                        status: "Đang làm việc",
                    };
                    return updatedHistory;
                }
                return [
                    ...prev,
                    { date: todayDate, checkIn: checkInTimeStr, checkOut: null, status: "Đang làm việc" },
                ];
            });

            setInfoModalTitle("Chấm công");
            setInfoModalMessage(`Bạn đã chấm công vào lúc: ${checkInTimeStr}`);
            setShowInfoModal(true);
            setCheckOutTime(null);

            const updatedShifts = await ApiWorkShift.getTodayWorkShifts();
            const current = updatedShifts.find(
                (s) => !s.attendance.checkedIn || (s.attendance.checkedIn && !s.attendance.checkedOut)
            );
            setCurrentShift(current || null);
        } catch (error) {
            setInfoModalTitle("Thông báo");
            setInfoModalMessage(`${error.response?.data?.message || error.message}`);
            setShowInfoModal(true);
        }
    };

    const handleCheckOut = async () => {
        if (!checkInTime) {
            setInfoModalTitle("Thông báo");
            setInfoModalMessage("Bạn phải chấm công vào trước khi chấm công ra.");
            setShowInfoModal(true);
            return;
        }

        try {
            const now = new Date();
            const checkOutTimeStr = now.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            });
            await ApiWorkShift.checkOutWorkShift("webcam");
            sendStatus(senderId, receiverId, "checkOutWorkShift");

            setCheckOutTime(checkOutTimeStr);
            setAttendanceHistory((prev) => {
                const todayDate = now.toISOString().split("T")[0];
                const existingEntryIndex = prev.findIndex((entry) => entry.date === todayDate);
                const existingCheckIn = prev[existingEntryIndex]?.checkIn;
                let status = "-";
                if (existingCheckIn) {
                    const [inHour, inMinute] = existingCheckIn.split(":").map(Number);
                    status = inHour < 8 || (inHour === 8 && inMinute === 0) ? "Đúng giờ" : "Đi trễ";
                }

                if (existingEntryIndex > -1) {
                    const updatedHistory = [...prev];
                    updatedHistory[existingEntryIndex] = {
                        ...updatedHistory[existingEntryIndex],
                        checkOut: checkOutTimeStr,
                        status,
                    };
                    return updatedHistory;
                }
                return [
                    ...prev,
                    { date: todayDate, checkIn: checkInTime, checkOut: checkOutTimeStr, status },
                ];
            });

            setInfoModalTitle("Chấm công");
            setInfoModalMessage(`Bạn đã chấm công ra lúc: ${checkOutTimeStr}`);
            setShowInfoModal(true);
            setCheckInTime(null);
            setCheckOutTime(null);

            const updatedShifts = await ApiWorkShift.getTodayWorkShifts();
            const current = updatedShifts.find(
                (s) => !s.attendance.checkedIn || (s.attendance.checkedIn && !s.attendance.checkedOut)
            );
            setCurrentShift(current || null);
        } catch (error) {
            setInfoModalTitle("Thông báo");
            setInfoModalMessage(`${error.response?.data?.message || error.message}`);
            setShowInfoModal(true);
        }
    };

    const getFilteredHistory = () => {
        const selectedDate = new Date(filterDate);
        if (filterType === "week") {
            const day = selectedDate.getDay();
            const offset = day === 0 ? -6 : 1 - day;
            const weekStart = new Date(selectedDate);
            weekStart.setDate(selectedDate.getDate() + offset);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return attendanceHistory.filter((entry) => {
                const entryDate = new Date(entry.date);
                return entryDate >= weekStart && entryDate <= weekEnd;
            });
        } else {
            const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            return attendanceHistory.filter((entry) => {
                const entryDate = new Date(entry.date);
                return entryDate >= monthStart && entryDate <= monthEnd;
            });
        }
    };

    const filteredHistory = getFilteredHistory();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <CurrentSchedule currentShift={currentShift} doctorInfo={doctorInfo} loadingDoctor={loadingDoctor} />
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Chấm công</Text>
                    <Text style={styles.sectionSubtitle}>Quản lý thời gian làm việc của bạn</Text>

                    <View style={styles.timeContainer}>
                        <Clock size={24} color="#007bff" />
                        <Text style={styles.currentTime}>
                            {currentTime.toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowScheduleFormModal(true)}
                        >
                            <PlusCircle size={12} color="#fff" />
                            <Text style={styles.buttonText}>Đăng ký lịch</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#17a2b8', marginLeft: 3 }]}
                            onPress={() => setShowSavedSchedulesModal(true)}
                        >
                            <List size={12} color="#fff" />
                            <Text style={styles.buttonText}>Lịch đã lưu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <ScheduleFormModal
                show={showScheduleFormModal}
                onClose={() => {
                    setShowScheduleFormModal(false);
                    resetScheduleForm();
                }}
                weekStartDate={weekStartDate}
                setWeekStartDate={setWeekStartDate}
                handleWeekStartChange={handleWeekStartChange}
                handleSelectCurrentWeek={handleSelectCurrentWeek}
                weeklySchedule={weeklySchedule}
                handleShiftToggle={handleShiftToggle}
                isEditing={isEditing}
                resetScheduleForm={resetScheduleForm}
                handleSaveOrUpdateSchedule={handleSaveOrUpdateSchedule}
                workType={workType}
                setWorkType={setWorkType}
                handleWorkTypeChange={handleWorkTypeChange}
            />
            <SavedSchedulesModal
                show={showSavedSchedulesModal}
                onClose={() => setShowSavedSchedulesModal(false)}
                savedSchedules={savedSchedules}
                formatDate={formatDate}
                handleEditSchedule={handleEditSchedule}
                handleDeleteSchedule={handleDeleteSchedule}
            />
            <InfoModal
                show={showInfoModal}
                title={infoModalTitle}
                message={infoModalMessage}
                onClose={() => setShowInfoModal(false)}
            />
            <ConfirmationModal
                show={showDeleteConfirmModal}
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa lịch làm việc này không? Hành động này không thể hoàn tác."
                onConfirm={confirmDeleteSchedule}
                onCancel={cancelDeleteSchedule}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        marginTop: 63,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginLeft: 8,
    },
    cardBody: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
    },
    doctorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    doctorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    doctorInfoText: {
        flex: 1,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    doctorSpecialty: {
        fontSize: 14,
        color: '#6b7280',
    },
    statusBadge: {
        backgroundColor: '#22c55e',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    scheduleDetails: {
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        color: '#1a1a1a',
        marginLeft: 8,
    },
    features: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    featureItem: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        backgroundColor: '#e0f2fe',
        borderRadius: 8,
        padding: 12,
    },
    currentTime: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginLeft: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    checkButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 6,
    },
    checkInButton: {
        backgroundColor: '#28a745',
    },
    checkOutButton: {
        backgroundColor: '#dc3545',
    },
    disabledButton: {
        backgroundColor: '#d1d5db',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 8,
        paddingHorizontal: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '500',
        marginLeft: 8,
    },
    historyContainer: {
        marginTop: 16,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    filterSelect: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    filterDate: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    historyItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    historyText: {
        fontSize: 14,
        color: '#1a1a1a',
        marginBottom: 4,
    },
    historyStatus: {
        fontSize: 12,
        fontWeight: '500',
        color: '#fff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    statusSuccess: {
        backgroundColor: '#22c55e',
    },
    statusWarning: {
        backgroundColor: '#f59e0b',
    },
    statusInfo: {
        backgroundColor: '#06b6d4',
    },
    alertInfo: {
        backgroundColor: '#e0f2fe',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    alertText: {
        color: '#1e40af',
        textAlign: 'center',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '90%',
        maxHeight: Dimensions.get('window').height * 0.9,
        minHeight: 400,
    },
    modalContentNotifications: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '90%',
        maxHeight: Dimensions.get('window').height * 0.8,
        minHeight: 100,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginLeft: 8,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        flex: 1,
        minHeight: 200,
    },
    modalBodyText: {
        fontSize: 14,
        color: '#1a1a1a',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    cancelButton: {
        backgroundColor: '#6b7280',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 8,
    },
    confirmButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    primaryButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-end',
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    centered: {
        textAlign: 'center',
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        marginRight: 8,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    currentWeekButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    workTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    workTypeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        marginHorizontal: 8,
        alignItems: 'center',
    },
    workTypeSelected: {
        borderColor: '#007bff',
        backgroundColor: '#e0f2fe',
    },
    workTypeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    workTypeTextSelected: {
        color: '#007bff',
    },
    workTypeDescription: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    weekGrid: {
        marginTop: 8,
    },
    dayCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    shiftGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    shiftButton: {
        flexBasis: '48%',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        marginBottom: 8,
        alignItems: 'center',
    },
    shiftButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    shiftButtonText: {
        fontSize: 14,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    shiftButtonTextSelected: {
        color: '#fff',
        fontWeight: '500',
    },
    scheduleItem: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    scheduleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    scheduleDay: {
        marginVertical: 4,
    },
    scheduleDayLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    scheduleNoShift: {
        fontSize: 14,
        color: '#6b7280',
    },
    scheduleShift: {
        fontSize: 14,
        color: '#1a1a1a',
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    scheduleActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    editButton: {
        padding: 8,
        marginRight: 8,
    },
    deleteButton: {
        padding: 8,
    },
    loadingText: {
        textAlign: 'center',
        color: '#007bff',
        fontSize: 16,
    },
});

export default AttendanceTab;