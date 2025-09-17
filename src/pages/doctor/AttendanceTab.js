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
import Icon from 'react-native-vector-icons/Feather';

// Shift options
const shiftOptions = [
    { key: 'morning', label: 'Sáng (08:00 - 12:00)' },
    { key: 'afternoon', label: 'Chiều (13:00 - 17:00)' },
    { key: 'evening', label: 'Tối (18:00 - 21:00)' },
];

// Weekday options
const weekdays = [
    { label: 'Thứ 2', key: 'monday' },
    { label: 'Thứ 3', key: 'tuesday' },
    { label: 'Thứ 4', key: 'wednesday' },
    { label: 'Thứ 5', key: 'thursday' },
    { label: 'Thứ 6', key: 'friday' },
    { label: 'Thứ 7', key: 'saturday' },
    { label: 'Chủ nhật', key: 'sunday' },
];

// Schedule Form Modal
const ScheduleFormModal = ({
    show,
    onClose,
    weekStartDate,
    setWeekStartDate,
    handleWeekStartChange,
    handleSelectCurrentWeek,
    weeklySchedule,
    handleShiftToggle,
    editingScheduleId,
    resetScheduleForm,
    handleSaveOrUpdateSchedule,
}) => (
    <Modal
        visible={show}
        animationType="slide"
        transparent={true}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Icon name="edit" size={24} color="#007bff" />
                    <Text style={styles.modalTitle}>
                        {editingScheduleId ? 'Cập nhật lịch làm việc' : 'Đăng ký lịch làm việc'}
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon name="x" size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                    {/* Chọn ngày bắt đầu tuần */}
                    <Text style={styles.formLabel}>Chọn tuần bắt đầu</Text>
                    <View style={styles.datePickerContainer}>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD"
                            value={weekStartDate}
                            onChangeText={(text) => handleWeekStartChange({ target: { value: text } })}
                            placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity style={styles.currentWeekButton} onPress={handleSelectCurrentWeek}>
                            <Icon name="calendar" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Tuần hiện tại</Text>
                        </TouchableOpacity>
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
                    {editingScheduleId && (
                        <TouchableOpacity style={styles.cancelButton} onPress={resetScheduleForm}>
                            <Text style={styles.buttonText}>Hủy</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                            handleSaveOrUpdateSchedule();
                            onClose();
                        }}
                    >
                        <Text style={styles.buttonText}>{editingScheduleId ? 'Cập nhật' : 'Lưu'}</Text>
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
                        <Text style={styles.buttonText}>Xác nhận</Text>
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
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Icon name="info" size={24} color="#007bff" />
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
                    <Icon name="list" size={24} color="#007bff" />
                    <Text style={styles.modalTitle}>Lịch làm việc đã lưu</Text>
                </View>
                <ScrollView style={styles.modalBody}>
                    {savedSchedules.length === 0 ? (
                        <View style={styles.alertInfo}>
                            <Text style={styles.alertText}>Chưa có lịch làm việc nào được lưu.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={savedSchedules}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.scheduleItem}>
                                    <Text style={styles.scheduleText}>Tuần bắt đầu: {formatDate(item.weekStartDate)}</Text>
                                    <View>
                                        {Object.entries(item.schedule).map(([dayKey, shifts]) => (
                                            <View key={dayKey} style={styles.scheduleDay}>
                                                <Text style={styles.scheduleDayLabel}>
                                                    {weekdays.find((d) => d.key === dayKey)?.label}:
                                                </Text>
                                                {shifts.length === 0 ? (
                                                    <Text style={styles.scheduleNoShift}>Không có ca</Text>
                                                ) : (
                                                    shifts.map((shift) => (
                                                        <Text key={shift} style={styles.scheduleShift}>
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
                                            <Icon name="edit" size={16} color="#007bff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteSchedule(item.id)}
                                        >
                                            <Icon name="trash-2" size={16} color="#dc3545" />
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
const CurrentSchedule = () => (
    <View style={styles.card}>
        <View style={styles.header}>
            <Icon name="calendar" size={24} color="#007bff" />
            <Text style={styles.headerTitle}>Lịch làm việc hiện tại</Text>
        </View>
        <View style={styles.cardBody}>
            <View style={styles.doctorInfo}>
                <Image
                    source={{ uri: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face' }}
                    style={styles.doctorAvatar}
                />
                <View style={styles.doctorInfoText}>
                    <Text style={styles.doctorName}>Bác sĩ Trần Thị B</Text>
                    <Text style={styles.doctorSpecialty}>Chuyên khoa Nội tiết</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Đang làm việc</Text>
                </View>
            </View>
            <View style={styles.scheduleDetails}>
                <View style={styles.detailItem}>
                    <Icon name="calendar" size={18} color="#007bff" />
                    <Text style={styles.detailText}>Tuần từ 28/7/2025</Text>
                </View>
                <View style={styles.detailItem}>
                    <Icon name="clock" size={18} color="#007bff" />
                    <Text style={styles.detailText}>Sáng (08:00 - 12:00), Thứ 2 - Thứ 6</Text>
                </View>
            </View>
            <View style={styles.features}>
                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#e8f5e8' }]}>
                        <Icon name="shield" size={20} color="#28a745" />
                    </View>
                    <Text style={styles.featureText}>Bảo mật 100%</Text>
                </View>
                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#fff3cd' }]}>
                        <Icon name="award" size={20} color="#ffc107" />
                    </View>
                    <Text style={styles.featureText}>Bác sĩ chuyên nghiệp</Text>
                </View>
                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: '#cce7ff' }]}>
                        <Icon name="clock" size={20} color="#007bff" />
                    </View>
                    <Text style={styles.featureText}>Hỗ trợ 24/7</Text>
                </View>
            </View>
        </View>
    </View>
);

// AttendanceTab component
const AttendanceTab = () => {
    const [savedSchedules, setSavedSchedules] = useState([]);
    const [checkInTime, setCheckInTime] = useState(null);
    const [checkOutTime, setCheckOutTime] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([
        { date: '2025-07-26', checkIn: '08:00', checkOut: '17:00', status: 'Đúng giờ' },
        { date: '2025-07-27', checkIn: '08:15', checkOut: '17:00', status: 'Đi trễ' },
        { date: '2025-07-28', checkIn: '07:55', checkOut: '17:05', status: 'Đúng giờ' },
    ]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoModalMessage, setInfoModalMessage] = useState('');
    const [infoModalTitle, setInfoModalTitle] = useState('');
    const [showScheduleFormModal, setShowScheduleFormModal] = useState(false);
    const [showSavedSchedulesModal, setShowSavedSchedulesModal] = useState(false);
    const [filterType, setFilterType] = useState('week');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [weekStartDate, setWeekStartDate] = useState('');
    const [weeklySchedule, setWeeklySchedule] = useState({});
    const [editingScheduleId, setEditingScheduleId] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleWeekStartChange = (e) => {
        const selectedDate = new Date(e.target.value);
        if (isNaN(selectedDate.getTime())) {
            setWeekStartDate('');
            return;
        }
        const day = selectedDate.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        const monday = new Date(selectedDate);
        monday.setDate(selectedDate.getDate() + offset);
        setWeekStartDate(monday.toISOString().split('T')[0]);
    };

    const handleSelectCurrentWeek = () => {
        const today = new Date();
        const day = today.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + offset);
        setWeekStartDate(monday.toISOString().split('T')[0]);
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

    const handleSaveOrUpdateSchedule = () => {
        if (!weekStartDate) {
            setInfoModalTitle('Lỗi');
            setInfoModalMessage('Vui lòng chọn ngày bắt đầu tuần.');
            setShowInfoModal(true);
            return;
        }

        const isDuplicateWeek = savedSchedules.some(
            (s) => s.weekStartDate === weekStartDate && s.id !== editingScheduleId
        );

        if (isDuplicateWeek) {
            setInfoModalTitle('Lỗi');
            setInfoModalMessage('Lịch làm việc cho tuần này đã tồn tại. Vui lòng chọn tuần khác hoặc chỉnh sửa lịch đã có.');
            setShowInfoModal(true);
            return;
        }

        if (editingScheduleId) {
            setSavedSchedules((prev) =>
                prev.map((s) =>
                    s.id === editingScheduleId
                        ? { ...s, weekStartDate, schedule: weeklySchedule }
                        : s
                )
            );
            setInfoModalTitle('Thành công');
            setInfoModalMessage('Lịch làm việc đã được cập nhật!');
        } else {
            const newSchedule = {
                id: Date.now(),
                weekStartDate,
                schedule: weeklySchedule,
            };
            setSavedSchedules((prev) => [...prev, newSchedule]);
            setInfoModalTitle('Thành công');
            setInfoModalMessage('Lịch làm việc đã được lưu!');
        }

        setShowInfoModal(true);
        resetScheduleForm();
    };

    const resetScheduleForm = () => {
        setWeekStartDate('');
        setWeeklySchedule({});
        setEditingScheduleId(null);
    };

    const handleEditSchedule = (schedule) => {
        setEditingScheduleId(schedule.id);
        setWeekStartDate(schedule.weekStartDate);
        setWeeklySchedule(schedule.schedule);
        setShowScheduleFormModal(true);
    };

    const handleDeleteSchedule = (id) => {
        setSavedSchedules((prev) => prev.filter((s) => s.id !== id));
        setInfoModalTitle('Thành công');
        setInfoModalMessage('Lịch làm việc đã được xóa!');
        setShowInfoModal(true);
    };

    const handleCheckIn = () => {
        const now = new Date();
        const checkInTimeStr = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
        const todayDate = now.toISOString().split('T')[0];

        setCheckInTime(checkInTimeStr);
        setAttendanceHistory((prev) => {
            const existingEntryIndex = prev.findIndex((entry) => entry.date === todayDate);
            if (existingEntryIndex > -1) {
                const updatedHistory = [...prev];
                updatedHistory[existingEntryIndex] = {
                    ...updatedHistory[existingEntryIndex],
                    checkIn: checkInTimeStr,
                    checkOut: null,
                    status: 'Đang làm việc',
                };
                return updatedHistory;
            }
            return [
                ...prev,
                { date: todayDate, checkIn: checkInTimeStr, checkOut: null, status: 'Đang làm việc' },
            ];
        });

        setInfoModalTitle('Chấm công');
        setInfoModalMessage(`Bạn đã chấm công vào lúc: ${checkInTimeStr}`);
        setShowInfoModal(true);
        setCheckOutTime(null);
    };

    const handleCheckOut = () => {
        if (!checkInTime) {
            setInfoModalTitle('Lỗi');
            setInfoModalMessage('Bạn phải chấm công vào trước khi chấm công ra.');
            setShowInfoModal(true);
            return;
        }

        const now = new Date();
        const checkOutTimeStr = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
        const todayDate = now.toISOString().split('T')[0];

        setCheckOutTime(checkOutTimeStr);
        setAttendanceHistory((prev) => {
            const existingEntryIndex = prev.findIndex((entry) => entry.date === todayDate);
            const existingCheckIn = prev[existingEntryIndex]?.checkIn;
            let status = 'N/A';
            if (existingCheckIn) {
                const [inHour, inMinute] = existingCheckIn.split(':').map(Number);
                status = inHour < 8 || (inHour === 8 && inMinute === 0) ? 'Đúng giờ' : 'Đi trễ';
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

        setInfoModalTitle('Chấm công');
        setInfoModalMessage(`Bạn đã chấm công ra lúc: ${checkOutTimeStr}`);
        setShowInfoModal(true);
        setCheckInTime(null);
        setCheckOutTime(null);
    };

    const formatDate = (d) => {
        if (!d) return '';
        const [year, month, day] = d.split('-');
        return `${day}/${month}/${year}`;
    };

    const getFilteredHistory = () => {
        const selectedDate = new Date(filterDate);
        if (filterType === 'week') {
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
                <CurrentSchedule />
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Chấm công</Text>
                    <Text style={styles.sectionSubtitle}>Quản lý thời gian làm việc của bạn</Text>
                    <View style={styles.timeContainer}>
                        <Icon name="clock" size={24} color="#007bff" />
                        <Text style={styles.currentTime}>
                            {currentTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}
                        </Text>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.checkButton, checkInTime && !checkOutTime ? styles.disabledButton : { backgroundColor: '#28a745' }]}
                            onPress={handleCheckIn}
                            disabled={checkInTime && !checkOutTime}
                        >
                            <Icon name="log-in" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Check-in</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.checkButton, !checkInTime || checkOutTime ? styles.disabledButton : { backgroundColor: '#dc3545' }]}
                            onPress={handleCheckOut}
                            disabled={!checkInTime || checkOutTime}
                        >
                            <Icon name="log-out" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Check-out</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.actionButtonContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setShowScheduleFormModal(true)}
                        >
                            <Icon name="plus-circle" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Đăng ký lịch</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#17a2b8' }]}
                            onPress={() => setShowSavedSchedulesModal(true)}
                        >
                            <Icon name="list" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Lịch đã lưu</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.historyContainer}>
                        <Text style={styles.historyTitle}>Lịch sử chấm công</Text>
                        <View style={styles.filterContainer}>
                            <TextInput
                                style={styles.filterSelect}
                                value={filterType}
                                onChangeText={setFilterType}
                                placeholder="Loại lọc (week/month)"
                            />
                            <TextInput
                                style={styles.filterDate}
                                value={filterDate}
                                onChangeText={setFilterDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                        {filteredHistory.length === 0 ? (
                            <View style={styles.alertInfo}>
                                <Text style={styles.alertText}>Chưa có lịch sử chấm công.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredHistory}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.historyItem}>
                                        <Text style={styles.historyText}>Ngày: {item.date}</Text>
                                        <Text style={styles.historyText}>Giờ vào: {item.checkIn || 'N/A'}</Text>
                                        <Text style={styles.historyText}>Giờ ra: {item.checkOut || 'N/A'}</Text>
                                        <Text
                                            style={[
                                                styles.historyStatus,
                                                item.status === 'Đúng giờ'
                                                    ? styles.statusSuccess
                                                    : item.status === 'Đi trễ'
                                                        ? styles.statusWarning
                                                        : styles.statusInfo,
                                            ]}
                                        >
                                            {item.status}
                                        </Text>
                                    </View>
                                )}
                            />
                        )}
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
                editingScheduleId={editingScheduleId}
                resetScheduleForm={resetScheduleForm}
                handleSaveOrUpdateSchedule={handleSaveOrUpdateSchedule}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
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
    disabledButton: {
        backgroundColor: '#d1d5db',
    },
    actionButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
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
        color: '#fff',
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
        maxHeight: Dimensions.get('window').height * 0.8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginLeft: 8,
    },
    closeButton: {
        padding: 8,
    },
    modalBody: {
        maxHeight: Dimensions.get('window').height * 0.6,
    },
    modalBodyText: {
        fontSize: 14,
        color: '#1a1a1a',
        marginBottom: 16,
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
        backgroundColor: '#dc2626',
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
        flex: 1,
        minWidth: '45%',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        marginBottom: 8,
        marginHorizontal: 4,
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
        marginBottom: 8,
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
});

export default AttendanceTab;