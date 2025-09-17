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
    [APPOINTMENT_STATUS.PENDING]: { bg: "warning", text: "dark" },
    [APPOINTMENT_STATUS.CONFIRMED]: { bg: "success", text: "white" },
    [APPOINTMENT_STATUS.CANCELED]: { bg: "danger", text: "white" },
    [APPOINTMENT_STATUS.COMPLETED]: { bg: "primary", text: "white" },
}


export const getLabelFromOptions = (options, value) => {
    const found = options.find(opt => opt.value === value);
    return found ? found.label : value;
};
