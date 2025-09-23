import React, { useEffect, useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser } from "../redux/authSlice";
import HealthTabs from "../pages/patient/HealthTabs";
import PersonalTabs from "../pages/patient/PersonalTabs";
import Home from "../pages/patient/Home";
import LoginForm from "../pages/auth/login";
import RegisterForm from "../pages/auth/register";
import BookingTabs from "../pages/patient/BookingTabs";
import NutritionTabs from "../pages/patient/NutritionTabs";
import ResetPassword from "../pages/auth/ResetPassword";
import OverviewTab from "../pages/doctor/OverviewTab";
import InformationTab from "../pages/doctor/InformationTab";
import AppointmentTab from "../pages/doctor/AppointmentTab";
import PatientTab from "../pages/doctor/PatientTab";
import AttendanceTab from "../pages/doctor/AttendanceTab";
import Header from "../routes/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Diagnosis from "../pages/patient/assistant/diagnosis";
import { auth } from "../../firebase";
import { dbCall } from "../../firebase";
import VideoCallModal from '../components/call/videoModalCall';
import {
  ref,
  onValue,
  off,
} from "firebase/database";
import {
  acceptCall,
  endCall,
  createCall,
  generateJitsiUrl,
} from '../components/call/functionCall';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DoctorTab = ({ route, handleStartCall }) => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              "Tổng quan": focused
                ? "chatbubble-ellipses"
                : "chatbubble-ellipses-outline",
              "Bệnh nhân": focused ? "id-card" : "id-card-outline",
              "Lịch hẹn": focused ? "sparkles" : "sparkles-outline",
              "Chấm công": focused ? "checkmark-done-circle" : "checkmark-done-circle-outline",
              "Thông tin": focused ? "person" : "person-outline",
              "Cài đặt": focused ? "person" : "person-outline",
            };
            return <Icon name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Tổng quan" component={OverviewTab} />
        <Tab.Screen name="Bệnh nhân">
          {(props) => <PatientTab {...props} handleStartCall={handleStartCall} />}
        </Tab.Screen>
        <Tab.Screen name="Lịch hẹn" component={AppointmentTab} />
        <Tab.Screen name="Chấm công" component={AttendanceTab} />
        <Tab.Screen name="Thông tin" component={InformationTab} />
      </Tab.Navigator>
    </View>
  );
};

const PatientTabs = ({ route, handleStartCall }) => {
  return (
    <View style={{ flex: 1, marginTop: 65 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              "Trang chủ": focused ? "home" : "home-outline", // Changed icon
              "Sức khỏe": focused ? "fitness" : "fitness-outline", // Changed icon
              "Dinh dưỡng": focused ? "restaurant" : "restaurant-outline", // Changed icon
              "Đặt lịch": focused ? "calendar" : "calendar-outline", // Changed icon
              "Trợ lý AI": focused ? "chatbubble" : "chatbubble-outline",
            };
            return <Icon name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Trang chủ" component={Home} />
        <Tab.Screen name="Sức khỏe" component={HealthTabs} />
        <Tab.Screen name="Dinh dưỡng" component={NutritionTabs} />
        <Tab.Screen name="Đặt lịch">
          {(props) => <BookingTabs {...props} handleStartCall={handleStartCall} />}
        </Tab.Screen>
        <Tab.Screen name="Trợ lý AI" component={Diagnosis} />
      </Tab.Navigator>
    </View>
  );
};

export default function Router() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(true);

  // Call states
  const [isCalling, setIsCalling] = useState(false);
  const [jitsiUrl, setJitsiUrl] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [callTimeout, setCallTimeout] = useState(null);

  // Refs for cleanup
  const callListenerRef = useRef(null);
  const initiatorListenerRef = useRef(null);

  const handleStartCall = async (caller, callee, role) => {
    try {
      if (!caller?.uid || !callee?.uid) {
        Alert.alert("Lỗi", "Không thể bắt đầu cuộc gọi. Thiếu thông tin người dùng.");
        return;
      }

      const setCallStates = {
        setIsCalling,
        setIsInitiator,
        setReceiver,
      };

      const callerWithRole = { ...caller, role };
      await createCall(callerWithRole, callee, dbCall, setCallStates);

      // Set timeout for call (30 seconds)
      const timeout = setTimeout(() => {
        if (isInitiator && !jitsiUrl) {
          Alert.alert("Hết thời gian", "Người nhận không trả lời.");
          handleEndCall();
        }
      }, 30000);
      setCallTimeout(timeout);

    } catch (error) {
      console.error("Error starting call:", error);
      Alert.alert("Lỗi", "Không thể bắt đầu cuộc gọi.");
    }
  };

  const handleAcceptCall = async () => {
    try {
      if (!incomingCall || !user) return;

      const setCallStates = {
        setIsCalling,
        setIncomingCall,
        setReceiver,
        setJitsiUrl,
      };

      await acceptCall(incomingCall, user, dbCall, setCallStates);
    } catch (error) {
      console.error("Error accepting call:", error);
      Alert.alert("Lỗi", "Không thể chấp nhận cuộc gọi.");
    }
  };

  const handleEndCall = async () => {
    try {
      // Clear timeout
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }

      const setCallStates = {
        setIsCalling,
        setIncomingCall,
        setIsInitiator,
        setReceiver,
        setJitsiUrl,
      };

      await endCall(receiver, isInitiator, user, dbCall, setCallStates);
    } catch (error) {
      console.error("Error ending call:", error);
      // Force reset states even if Firebase call fails
      setIsCalling(false);
      setIncomingCall(null);
      setIsInitiator(false);
      setReceiver(null);
      setJitsiUrl(null);
    }
  };

  const handleDeclineCall = async () => {
    try {
      await handleEndCall();
    } catch (error) {
      console.error("Error declining call:", error);
    }
  };

  // Listen for call status when initiator
  useEffect(() => {
    if (isInitiator && receiver?.uid && user?.uid) {
      const callRef = ref(dbCall, `calls/${receiver.uid.replace(/[.#$[\]]/g, '_')}`);

      const unsubscribe = onValue(
        callRef,
        (snapshot) => {
          try {
            const callData = snapshot.val();
            if (callData && callData.status === "accepted") {
              const { from, to } = callData;
              if (from?.uid && to?.uid) {
                const url = generateJitsiUrl(from.uid, to.uid);
                setJitsiUrl(url);
                setIsCalling(true);

                // Clear timeout when call is accepted
                if (callTimeout) {
                  clearTimeout(callTimeout);
                  setCallTimeout(null);
                }
              }
            } else if (callData && callData.status === "declined") {
              Alert.alert("Cuộc gọi bị từ chối", "Người nhận đã từ chối cuộc gọi.");
              handleEndCall();
            } else if (!callData) {
              // Call was ended by receiver
              handleEndCall();
            }
          } catch (error) {
            console.error("Error processing call status:", error);
          }
        },
        (error) => {
          console.error("Error listening to call status:", error);
        }
      );

      initiatorListenerRef.current = unsubscribe;

      return () => {
        if (initiatorListenerRef.current) {
          off(callRef);
          initiatorListenerRef.current = null;
        }
      };
    }
  }, [isInitiator, receiver, user, callTimeout]);

  // Listen for incoming calls
  useEffect(() => {
    if (user?.uid) {
      const callListener = ref(dbCall, `calls/${user.uid.replace(/[.#$[\]]/g, '_')}`);

      const unsubscribe = onValue(
        callListener,
        (snapshot) => {
          try {
            const callData = snapshot.val();

            if (callData && callData.status === "pending") {
              const { from, to } = callData;
              if (from?.uid && to?.uid && to.uid === user.uid) {
                setIncomingCall(from);
                setReceiver(to);
              }
            } else if (callData && callData.status === "accepted") {
              const { from, to } = callData;
              if (from?.uid && to?.uid) {
                const url = generateJitsiUrl(from.uid, to.uid);
                setJitsiUrl(url);
                setIsCalling(true);
              }
            } else if (!callData || callData.status === "ended") {
              // Call was ended or doesn't exist
              if (isCalling || incomingCall) {
                setIncomingCall(null);
                setJitsiUrl(null);
                setIsCalling(false);
              }
            }
          } catch (error) {
            console.error("Error processing incoming call:", error);
          }
        },
        (error) => {
          console.error("Error listening to incoming calls:", error);
        }
      );

      callListenerRef.current = unsubscribe;

      return () => {
        if (callListenerRef.current) {
          off(callListener);
          callListenerRef.current = null;
        }
      };
    }
  }, [user, isCalling, incomingCall]);

  // Authentication state management
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Update access token
          const token = await firebaseUser.getIdToken();
          await AsyncStorage.setItem("access_Token", token);
          // Get user info from AsyncStorage
          const userInfoString = await AsyncStorage.getItem("userInfo");
          const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

          if (userInfo) {
            // Dispatch user info to Redux
            dispatch(
              setUser({
                userId: userInfo.userId,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: userInfo.username,
                photoURL: firebaseUser.photoURL,
                role: userInfo.role,
                address: userInfo.address,
                phone: userInfo.phone,
                dob: userInfo.dob,
                gender: userInfo.gender,
                emailVerified: firebaseUser.emailVerified,
              })
            );
          } else {
            // If no userInfo in storage, user might need to complete registration
            console.log("No user info in storage");
          }
        } else {
          // User logged out
          console.log("User logged out, clearing state");
          dispatch(clearUser());
          await AsyncStorage.clear();
        }
      } catch (error) {
        console.error("Error handling auth state:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimeout) {
        clearTimeout(callTimeout);
      }
      if (callListenerRef.current) {
        callListenerRef.current();
      }
      if (initiatorListenerRef.current) {
        initiatorListenerRef.current();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {user && <Header />}

      {/* Incoming call popup */}
      {!isInitiator && incomingCall && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {incomingCall.username || incomingCall.email || 'Người dùng'} đang gọi bạn...
                </Text>
                <Text style={styles.modalSubtitle}>
                  {incomingCall.role === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleAcceptCall}
                    style={[styles.button, styles.primaryButton]}
                  >
                    <Text style={styles.buttonText}>Chấp nhận</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDeclineCall}
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
        <VideoCallModal
          jitsiUrl={jitsiUrl}
          onClose={handleEndCall}
        />
      )}

      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginForm}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterForm}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPassword}
          options={{ headerShown: false }}
        />

        {user && user.role === 'doctor' ? (
        <Stack.Screen
          name="DoctorTab"
          options={{ headerShown: false }}
        >
          {(props) => <DoctorTab {...props} handleStartCall={handleStartCall} />}
        </Stack.Screen>
        ) : (
        <>
          <Stack.Screen
            name="PatientTabs"
            options={{ headerShown: false }}
          >
            {(props) => <PatientTabs {...props} handleStartCall={handleStartCall} />}
          </Stack.Screen>
          <Stack.Screen
            name="PersonalTabs"
            component={PersonalTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Diagnosis"
            component={Diagnosis}
            options={{ headerShown: false }}
          />
        </>
        )}
      </Stack.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});