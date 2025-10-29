import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import WebView from "react-native-webview";
const { width, height } = Dimensions.get("window");

// Modal hiển thị WebView Jitsi
const VideoCallModal = ({ jitsiUrl, onClose, visible = true }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header với nút đóng */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body chứa WebView */}
          <View style={styles.modalBody}>
            {!jitsiUrl ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007ACC" />
                <Text style={styles.loadingText}>
                  Đang chờ kết nối cuộc gọi...
                </Text>
              </View>
            ) : Platform.OS === "web" ? (
              <iframe
                src={jitsiUrl}
                title="Video Call"
                allow="camera; microphone; fullscreen; display-capture; screen-wake-lock"
                style={{ width: "100%", height: "100%", border: "none" }}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <WebView source={{ uri: jitsiUrl }} style={{ flex: 1 }} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.95,
    height: height * 0.85,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    height: 50,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 15,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 15,
  },
  webview: {
    flex: 1,
  },
  webviewLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -25,
    marginTop: -25,
  },
});

export default VideoCallModal;
