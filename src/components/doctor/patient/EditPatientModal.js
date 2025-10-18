import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { X, Stethoscope, FileText, Plus, Trash2 } from "lucide-react-native";
import ApiDoctor from "../../../apis/ApiDoctor";
import { useDispatch, useSelector } from "react-redux";
import { listenStatus, sendStatus } from "../../../utils/SetupSignFireBase";
import { applyMedicines, fetchMedicines } from "../../../redux/medicineAiSlice";

const { width, height } = Dimensions.get("window");

const EditPatientModal = ({ show, onHide, patient, onSave }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userInfo);
  const doctorUid = user?.uid;
  const patientUid = user?.uid;
  const roomChats = doctorUid ? [doctorUid, patientUid].sort().join("_") : null;

  // State để lưu dữ liệu form
  const [formData, setFormData] = useState({
    disease: "",
    status: "Theo dõi",
    allergies: "",
    notes: "",
  });

  // State thuốc
  const [medicines, setMedicines] = useState({
    sang: [],
    trua: [],
    toi: [],
  });

  const categorizeMedicines = (list) => {
    const sang = [];
    const trua = [];
    const toi = [];

    const instructions = {
      sang: "uống sau ăn",
      trua: "uống trước ăn",
      toi: "tiêm trước khi đi ngủ",
    };

    list.forEach((m) => {
      const hour = m.time.split("T")[1].split(":")[0];
      const hourNum = parseInt(hour, 10);

      if (hourNum >= 5 && hourNum < 11) {
        sang.push(`${m.name} ${m.lieu_luong} - ${instructions.sang}`);
      } else if (hourNum >= 11 && hourNum < 17) {
        trua.push(`${m.name} ${m.lieu_luong} - ${instructions.trua}`);
      } else if (hourNum >= 17 && hourNum <= 22) {
        toi.push(`${m.name} ${m.lieu_luong} - ${instructions.toi}`);
      }
    });

    return { sang, trua, toi };
  };

  useEffect(() => {
    const fetchMedicine = async () => {
      const today = new Date();

      const res = await dispatch(
        fetchMedicines({ userId: patient.userId._id, date: today })
      );

      if (res?.payload?.DT) {
        const data = res.payload.DT;

        const categorized = categorizeMedicines(data);
        setMedicines(categorized);
      }
    };

    fetchMedicine();
  }, [dispatch, patient.userId._id]);

  // State để lưu lỗi validation
  const [errors, setErrors] = useState({});

  // Cập nhật formData khi patient thay đổi
  useEffect(() => {
    if (patient) {
      setFormData({
        disease: patient.disease || "",
        status: patient.status || "Theo dõi",
        allergies: patient.allergies || "",
        notes: patient.notes || "",
      });
    }
  }, [patient]);

  // Lắng nghe realtime từ Firebase
  useEffect(() => {
    if (!roomChats) {
      return;
    }

    const unsubscribe = listenStatus(roomChats, (signal) => {
      if (signal?.status === "update_patient_info") {
        setFormData((prev) => ({
          ...prev,
          ...patient, // Cập nhật từ patient props
        }));
      }
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [roomChats, patient]);

  // Hàm thêm thuốc mới
  const addMedicine = (time) => {
    setMedicines((prev) => ({
      ...prev,
      [time]: [...prev[time], ""],
    }));
  };

  // Hàm xóa thuốc
  const removeMedicine = (time, index) => {
    setMedicines((prev) => ({
      ...prev,
      [time]: prev[time].filter((_, i) => i !== index),
    }));
  };

  // kiểm tra input thuốc
  const validateMedicineFormat = (medicineString) => {
    const regex = /^.+?\s\d+[\w\s]*\s-\s.+$/i;
    return regex.test(medicineString.trim());
  };

  // Hàm cập nhật thuốc
  const updateMedicine = (time, index, value) => {
    setMedicines((prev) => ({
      ...prev,
      [time]: prev[time].map((item, i) => (i === index ? value : item)),
    }));

    if (value.trim() && !validateMedicineFormat(value)) {
      setErrors((prev) => ({
        ...prev,
        medicine: {
          ...prev.medicine,
          [`${time}_${index}`]:
            "Định dạng sai: [Thuốc Liều lượng] - [Cách dùng]",
        },
      }));
    } else {
      setErrors((prev) => {
        const newMedicineErrors = { ...prev.medicine };
        delete newMedicineErrors[`${time}_${index}`];
        return { ...prev, medicine: newMedicineErrors };
      });
    }
  };

  // Hàm kiểm tra dữ liệu đầu vào
  const validateForm = () => {
    const newErrors = {};
    if (!formData.disease.trim()) newErrors.disease = "Bệnh là bắt buộc";

    // Kiểm tra tất cả các mục thuốc
    const medicineErrors = {};
    Object.entries(medicines).forEach(([time, arr]) => {
      arr.forEach((item, index) => {
        // Chỉ kiểm tra các dòng không rỗng
        if (item.trim() && !validateMedicineFormat(item)) {
          medicineErrors[`${time}_${index}`] =
            "Sai định dạng: Metformin 500mg - uống sau ăn";
        }
      });
    });

    if (Object.keys(medicineErrors).length > 0) {
      newErrors.medicine = medicineErrors;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Parse medicine
  function parseMedicine(item, time, userId) {
    const [thuocLieu, cachDung] = item.split(" - ");
    const parts = thuocLieu?.trim().split(" ") || [];
    const idx = parts.findIndex((p) => /\d/.test(p));

    let thuoc = thuocLieu || "";
    let lieuluong = "";

    if (idx !== -1) {
      thuoc = parts.slice(0, idx).join(" ");
      lieuluong = parts.slice(idx).join(" ");
    }

    return {
      userId,
      name: thuoc.trim(),
      lieu_luong: lieuluong.trim(),
      Cachdung: cachDung?.trim(),
      time: time,
      status: false,
    };
  }

  // Apply prescription
  const applyPrescriptionOneWeek = async () => {
    const allParsedMedicines = [];

    Object.entries(medicines).forEach(([time, arr]) => {
      arr.forEach((item) => {
        if (item.trim()) {
          const parsed = parseMedicine(item, time, patient?.userId._id);
          allParsedMedicines.push(parsed);
          console.log("=> parse:", parsed);
          dispatch(applyMedicines(parsed));
        }
      });
    });

    return allParsedMedicines;
  };

  // Xử lý khi gửi form
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await applyPrescriptionOneWeek();

        await ApiDoctor.updatePatientHealthInfo(patient.id, formData);

        // Gửi tín hiệu realtime
        if (doctorUid) {
          sendStatus(doctorUid, patientUid, "update_patient_info");
        } else {
          console.error("Cannot send status: doctorUid is undefined");
        }

        // Cập nhật danh sách tại giao diện hiện tại
        onSave({ ...patient, ...formData });

        setErrors({});
        onHide();
      } catch (error) {
        console.error("Lỗi khi cập nhật thông tin y tế:", error);
        setErrors({
          api: "Không thể cập nhật thông tin. Vui lòng thử lại sau.",
        });
      }
    }
  };

  // Xử lý thay đổi giá trị input
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  if (!show || !patient) return null;

  const timeLabels = {
    sang: "Sáng",
    trua: "Trưa",
    toi: "Tối",
  };

  return (
    <Modal visible={show} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Chỉnh sửa thông tin y tế bệnh nhân
            </Text>
            <TouchableOpacity onPress={onHide} style={styles.closeButton}>
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin y tế</Text>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Stethoscope size={16} color="#1a3c6e" />
                  <Text style={styles.label}>Bệnh *</Text>
                </View>
                <TextInput
                  style={[styles.input, errors.disease && styles.inputError]}
                  value={formData.disease}
                  onChangeText={(value) => handleChange("disease", value)}
                  placeholder="Nhập tên bệnh"
                  placeholderTextColor="#9ca3af"
                />
                {errors.disease && (
                  <Text style={styles.errorText}>{errors.disease}</Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Tình trạng *</Text>
                </View>
                <View
                  style={[
                    styles.pickerContainer,
                    errors.status && styles.inputError,
                  ]}
                >
                  <Picker
                    selectedValue={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Cần theo dõi" value="Cần theo dõi" />
                    <Picker.Item label="Đang điều trị" value="Đang điều trị" />
                    <Picker.Item label="Theo dõi" value="Theo dõi" />
                    <Picker.Item label="Ổn định" value="Ổn định" />
                  </Picker>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Dị ứng</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.allergies}
                  onChangeText={(value) => handleChange("allergies", value)}
                  placeholder="Nhập thông tin dị ứng (nếu có)"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <FileText size={16} color="#1a3c6e" />
                  <Text style={styles.label}>Ghi chú</Text>
                </View>
                <TextInput
                  style={styles.textArea}
                  value={formData.notes}
                  onChangeText={(value) => handleChange("notes", value)}
                  placeholder="Ghi chú thêm về bệnh nhân"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.medicineSection}>
                {/* Header */}
                <Text style={styles.sectionTitle}>Đơn thuốc</Text>

                {/* Render từng buổi: Sáng, Trưa, Tối */}
                {Object.entries(medicines).map(([time, medicineList]) => (
                  <View key={time} style={styles.timeBlock}>
                    {/* Header của mỗi buổi */}
                    <View style={styles.timeHeader}>
                      <Text style={styles.timeLabel}>{timeLabels[time]}</Text>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => addMedicine(time)}
                      >
                        <Plus size={16} color="#4F46E5" />
                        <Text style={styles.addButtonText}>Thêm thuốc</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Danh sách thuốc hoặc empty state */}
                    {medicineList.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chưa có thuốc</Text>
                      </View>
                    ) : (
                      <View style={styles.medicineList}>
                        {medicineList.map((medicine, index) => (
                          <View key={index} style={styles.medicineItem}>
                            <View style={styles.medicineRow}>
                              <TextInput
                                style={[
                                  styles.medicineInput,
                                  errors.medicine?.[`${time}_${index}`] &&
                                    styles.inputError,
                                ]}
                                value={medicine}
                                onChangeText={(value) =>
                                  updateMedicine(time, index, value)
                                }
                                placeholder="Ví dụ: Metformin 500mg - uống sau ăn"
                                placeholderTextColor="#9ca3af"
                              />
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => removeMedicine(time, index)}
                              >
                                <Trash2 size={16} color="#dc3545" />
                              </TouchableOpacity>
                            </View>
                            {errors.medicine?.[`${time}_${index}`] && (
                              <Text style={styles.errorText}>
                                {errors.medicine[`${time}_${index}`]}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
              {errors.api && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.api}</Text>
                </View>
              )}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onHide}>
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Cập nhật</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.8,
    padding: width * 0.05,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "700",
    color: "#1a3c6e",
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 12,
  },
  section: {
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#1a3c6e",
    marginBottom: 8,
  },
  inputGroup: {
    gap: 6,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: width * 0.04,
    fontWeight: "500",
    color: "#1a3c6e",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: width * 0.03,
    fontSize: width * 0.04,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e4e8",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e4e8",
    overflow: "hidden",
  },
  picker: {
    fontSize: width * 0.04,
    color: "#333",
  },
  textArea: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: width * 0.03,
    fontSize: width * 0.04,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e4e8",
    minHeight: height * 0.1,
  },
  errorContainer: {
    backgroundColor: "#f8d7da",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: width * 0.035,
    color: "#dc3545",
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
  },
  cancelButton: {
    backgroundColor: "#6b7280",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: width * 0.04,
    color: "#fff",
    fontWeight: "600",
  },

  // thuốc
   medicineSection: {
    marginTop: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
  },
  timeBlock: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
    marginBottom: 12,
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#4F46E5',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#ffffff',
  },
  addButtonText: {
    fontSize: width * 0.035,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: width * 0.035,
    color: '#9ca3af',
  },
  medicineList: {
    gap: 8,
  },
  medicineItem: {
    gap: 4,
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicineInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
    fontSize: width * 0.037,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e4e8',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc3545',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: width * 0.032,
    color: '#dc3545',
    marginLeft: 4,
    marginTop: 2,
  },
});

export default EditPatientModal;
