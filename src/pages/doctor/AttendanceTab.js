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

// Confirmation Modal
const ConfirmationModal = ({ show, title, message, onConfirm, onCancel }) => (
    <Modal
        visible={show}
        animationType="slide"
        transparent={true}
    >
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalBody}>{message}</Text>
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
        animationType="slide"
        transparent={true}
    >
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Icon name="info" size={20} color="#007bff" />
                    <Text style={styles.modalTitle}>{title}</Text>
                </View>
                <Text style={styles.modalBody}>{message}</Text>
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                        <Text style={styles.buttonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

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
        <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { maxWidth: Dimensions.get('window').width * 0.9 }]}>
                <View style={styles.modalHeader}>
                    <Icon name="edit" size={20} color="#007bff" />
                    <Text style={styles.modalTitle}>
                        {editingScheduleId ? 'Cập nhật lịch làm việc' : 'Đăng ký lịch làm việc'}
                    </Text>
                </View>
                <ScrollView style={styles.modalBody}>
                    <Text style={styles.formLabel}>Chọn tuần (YYYY-MM-DD)</Text>
                    <View style={styles.datePickerContainer}>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD"
                            value={weekStartDate}
                            onChangeText={(text) => handleWeekStartChange({ target: { value: text } })}
                        />
                        <TouchableOpacity style={styles.currentWeekButton} onPress={handleSelectCurrentWeek}>
                            <Icon name="calendar" size={18} color="#007bff" />
                            <Text style={styles.buttonText}>Tuần hiện tại</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.formLabel, styles.centered]}>Chọn ca làm việc</Text>
                    {weekdays.map((day) => (
                        <View key={day.key} style={styles.dayContainer}>
                            <Text style={styles.dayLabel}>{day.label}</Text>
                            <View style={styles.shiftContainer}>
                                {shiftOptions.map((shift) => (
                                    <View key={shift.key} style={styles.shiftItem}>
                                        <TouchableOpacity
                                            onPress={() => handleShiftToggle(day.key, shift.key)}
                                            style={styles.checkboxContainer}
                                        >
                                            <View style={weeklySchedule[day.key]?.includes(shift.key) ? styles.checkboxChecked : styles.checkbox}>
                                                {weeklySchedule[day.key]?.includes(shift.key) && <Icon name="check" size={14} color="#fff" />}
                                            </View>
                                            <Text style={styles.shiftLabel}>{shift.label}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
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
        <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { maxWidth: Dimensions.get('window').width * 0.9 }]}>
                <View style={styles.modalHeader}>
                    <Icon name="list" size={20} color="#007bff" />
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
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.buttonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

// CurrentSchedule component
const CurrentSchedule = () => (
    <View style={styles.container}>
        <View style={styles.card}>
            <View style={styles.header}>
                <Icon name="calendar" size={24} color="#007bff" />
                <Text style={styles.headerTitle}>Lịch làm việc hiện tại</Text>
            </View>
            <View style={[styles.cardBody, { backgroundColor: '#f0f2ff' }]}>
                <View style={styles.doctorInfo}>
                    <Image
                        source={{ uri: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face' }}
                        style={styles.doctorAvatar}
                    />
                    <View>
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
        <ScrollView style={styles.container}>
            <CurrentSchedule />
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Chấm công</Text>
                <Text style={styles.sectionSubtitle}>Quản lý thời gian làm việc của bạn</Text>
                <View style={styles.timeContainer}>
                    <Icon name="clock" size={20} color="#007bff" />
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
                        style={[styles.checkButton, { backgroundColor: '#28a745' }]}
                        onPress={handleCheckIn}
                        disabled={checkInTime && !checkOutTime}
                    >
                        <Icon name="clock" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Going</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.checkButton, { backgroundColor: '#dc3545' }]}
                        onPress={handleCheckOut}
                        disabled={!checkInTime || checkOutTime}
                    >
                        <Icon name="clock" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Leaving</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.actionButtonContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowScheduleFormModal(true)}
                    >
                        <Icon name="plus-circle" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Đăng ký lịch làm việc</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#17a2b8' }]}
                        onPress={() => setShowSavedSchedulesModal(true)}
                    >
                        <Icon name="list" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Lịch làm việc đã lưu</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.historyContainer}>
                    <Text style={styles.historyTitle}>Lịch sử chấm công</Text>
                    <View style={styles.filterContainer}>
                        <TextInput
                            style={styles.filterSelect}
                            value={filterType}
                            onChangeText={setFilterType}
                            placeholder="Chọn loại lọc (week/month)"
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
                            <Text style={styles.alertText}>Chưa có lịch sử chấm công trong khoảng thời gian này.</Text>
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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 10,
    },
    cardBody: {
        padding: 15,
        borderRadius: 16,
    },
    doctorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    doctorAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 10,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    doctorSpecialty: {
        fontSize: 14,
        color: '#6c757d',
    },
    statusBadge: {
        backgroundColor: '#28a745',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
    },
    scheduleDetails: {
        marginBottom: 10,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailText: {
        fontSize: 16,
        color: '#000',
        marginLeft: 10,
    },
    features: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    featureItem: {
        flex: 1,
        alignItems: 'center',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    featureText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 15,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    currentTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    checkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    actionButtonContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 5,
    },
    historyContainer: {
        marginTop: 15,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    filterSelect: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
    },
    filterDate: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 5,
        padding: 10,
    },
    historyItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    historyText: {
        fontSize: 14,
        color: '#000',
    },
    historyStatus: {
        fontSize: 12,
        color: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    statusSuccess: {
        backgroundColor: '#28a745',
    },
    statusWarning: {
        backgroundColor: '#ffc107',
        color: '#000',
    },
    statusInfo: {
        backgroundColor: '#17a2b8',
    },
    alertInfo: {
        backgroundColor: '#d1ecf1',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    alertText: {
        color: '#0c5460',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 10,
    },
    modalBody: {
        maxHeight: Dimensions.get('window').height * 0.6,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginRight: 10,
    },
    confirmButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    primaryButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 10,
    },
    centered: {
        textAlign: 'center',
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    dateInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
    },
    currentWeekButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9ecef',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    dayContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
        paddingBottom: 10,
        marginBottom: 10,
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        marginBottom: 10,
    },
    shiftContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    shiftItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginBottom: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        width: 20,
        height: 20,
        backgroundColor: '#007bff',
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shiftLabel: {
        fontSize: 14,
        color: '#000',
        marginLeft: 5,
    },
    scheduleItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    scheduleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    scheduleDay: {
        marginVertical: 5,
    },
    scheduleDayLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    scheduleNoShift: {
        fontSize: 14,
        color: '#6c757d',
    },
    scheduleShift: {
        fontSize: 14,
        color: '#000',
        backgroundColor: '#e9ecef',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginTop: 5,
    },
    scheduleActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    editButton: {
        padding: 5,
        marginRight: 10,
    },
    deleteButton: {
        padding: 5,
    },
});

export default AttendanceTab;