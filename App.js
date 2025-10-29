import React, { useEffect, useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
  Modal,Text, TouchableOpacity
} from "react-native";
import { Provider, useSelector } from "react-redux";
import { store } from "./src/redux/store";
import Router from "./src/routes/Router";
import { NavigationContainer } from "@react-navigation/native";
import VideoCallModal from "./src/components/call/videoModalCall";
import { dbCall } from "./firebase";
import { ref, onValue, off } from "firebase/database";
import {
  acceptCall,
  endCall,
  createCall,
  generateJitsiUrl,
} from "./src/components/call/functionCall";

export default function App() {
  return (
    <Provider store={store}>
      <Project />
    </Provider>
  );
}

const Project = () => {
  const user = useSelector((state) => state.auth.user);

  // Gọi điện
  const [isCalling, setIsCalling] = useState(false);
  const [jitsiUrl, setJitsiUrl] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);

  const handleStartCall = (caller, callee, role) => {
    const setCallStates = {
      setIsCalling,
      setIsInitiator,
      setReceiver,
    };

    // Thêm role cho caller
    const callerWithRole = { ...caller, role: role };

    createCall(callerWithRole, callee, dbCall, setCallStates);
  };

  const handleAcceptCall = async () => {
    const setCallStates = {
      setIsCalling,
      setIncomingCall,
      setReceiver,
      setJitsiUrl,
    };

    await acceptCall(incomingCall, user, dbCall, setCallStates);
  };

  const handleEndCall = async () => {
    const setCallStates = {
      setIsCalling,
      setIncomingCall,
      setIsInitiator,
      setReceiver,
      setJitsiUrl,
    };

    await endCall(receiver, isInitiator, user, dbCall, setCallStates);
  };

  // Lắng nghe trạng thái cuộc gọi khi là người khởi tạo
  useEffect(() => {
    if (isInitiator && receiver && receiver.uid) {
      const callRef = ref(
        dbCall,
        `calls/${receiver.uid.replace(/[.#$[\]]/g, "_")}`
      );
      const unsubscribe = onValue(
        callRef,
        (snapshot) => {
          const callData = snapshot.val();
          if (callData && callData.status === "accepted") {
            const { from, to } = callData;
            setJitsiUrl(generateJitsiUrl(from.uid, to.uid));
            setIsCalling(true);
          }
        },
        (err) => {
          console.log("Lỗi khi lắng nghe trạng thái cuộc gọi:", err);
        }
      );

      return () => {
        off(callRef);
      };
    }
  }, [isInitiator, receiver]);

  // Lắng nghe cuộc gọi đến
  useEffect(() => {
    console.log('🔍 useEffect lắng nghe cuộc gọi đến - User:', user);
    if (user && user.uid) {
      const callListener = ref(
        dbCall,
        `calls/${user.uid.replace(/[.#$[\]]/g, "_")}`
      );
      const unsubscribe = onValue(
        callListener,
        (snapshot) => {
          const callData = snapshot.val();
          if (callData && callData.status === "pending") {
            const { from, to } = callData;
            if (from?.uid && to?.uid) {
              setIncomingCall(from);
              setReceiver(to);
            }
          } else if (callData && callData.status === "accepted") {
            const { from, to } = callData;
            if (from?.uid && to?.uid) {
              setJitsiUrl(generateJitsiUrl(from.uid, to.uid));
              setIsCalling(true);
            }
          } else {
            setIncomingCall(null);
            setJitsiUrl(null);
          }
        },
        (err) => {
          console.error("Lỗi khi lắng nghe cuộc gọi:", err);
        }
      );

      return () => {
        off(callListener);
      };
    }
  }, [user]);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer>
          <Router handleStartCall={handleStartCall}/>
        </NavigationContainer>
      </SafeAreaView>

      {/* Incoming call popup */}
      {!isInitiator && incomingCall && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {incomingCall.username || "Người dùng"} đang gọi bạn...
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleAcceptCall}
                    style={[styles.button, styles.primaryButton]}
                  >
                    <Text style={styles.buttonText}>Chấp nhận</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleEndCall}
                    style={[styles.button, styles.dangerButton]}
                  >
                    <Text style={styles.buttonText}>Từ chối</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Video call modal */}
      {isCalling && (
        <VideoCallModal jitsiUrl={jitsiUrl} onClose={handleEndCall} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24, // Tăng margin để tách nút
    textAlign: "center",
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 20, // Tăng khoảng cách giữa các nút
    justifyContent: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: "#007bff", // Màu xanh dương cho Chấp nhận
  },
  dangerButton: {
    backgroundColor: "#dc3545", // Màu đỏ cho Từ chối
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
