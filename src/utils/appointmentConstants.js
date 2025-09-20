export const APPOINTMENT_TYPES = {
    ONSITE: "onsite",
    ONLINE: "online",
}

export const TYPE_OPTIONS = [
    { value: APPOINTMENT_TYPES.ONSITE, label: "Tại phòng khám" },
    { value: APPOINTMENT_TYPES.ONLINE, label: "Khám trực tuyến" },
]

export const APPOINTMENT_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELED: "canceled",
    COMPLETED: "completed",
}

export const STATUS_OPTIONS = [
    { value: APPOINTMENT_STATUS.PENDING, label: "Chờ xác nhận" },
    { value: APPOINTMENT_STATUS.CONFIRMED, label: "Đã xác nhận" },
    { value: APPOINTMENT_STATUS.CANCELED, label: "Đã hủy" },
    { value: APPOINTMENT_STATUS.COMPLETED, label: "Hoàn thành" },
]

// Badge màu
export const STATUS_COLORS = {
    [APPOINTMENT_STATUS.PENDING]: { bg: "#ffc107", text: "#212529" }, // warning, dark
    [APPOINTMENT_STATUS.CONFIRMED]: { bg: "#198754", text: "#ffffff" }, // success, white
    [APPOINTMENT_STATUS.CANCELED]: { bg: "#dc3545", text: "#ffffff" }, // danger, white
    [APPOINTMENT_STATUS.COMPLETED]: { bg: "#0d6efd", text: "#ffffff" }, // primary, white
};
