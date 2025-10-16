import {
  ref,
  set,
  remove,
  get,
} from "firebase/database";

// Helper function to create safe keys for Firebase
export const safeKey = (str) => {
  if (!str) return '';
  return str.replace(/[.#$[\]]/g, '_');
};

// Function to accept call
export const acceptCall = async (incomingCall, user, dbCall, setCallStates) => {
  if (!incomingCall || !user || !incomingCall.uid || !user.uid) {
    console.error("Missing required data for accepting call");
    return;
  }

  const {
    setIsCalling,
    setIncomingCall,
    setReceiver,
    setJitsiUrl
  } = setCallStates;

  try {
    const userSafeKey = safeKey(user.uid);
    const callerSafeKey = safeKey(incomingCall.uid);

    const callRef = ref(dbCall, `calls/${userSafeKey}`);
    const callerRef = ref(dbCall, `calls/${callerSafeKey}`);

    const callData = {
      from: {
        uid: incomingCall.uid,
        username: incomingCall.username || incomingCall.displayName || incomingCall.email || (incomingCall.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"),
        role: incomingCall.role || "user"
      },
      to: {
        uid: user.uid,
        username: user.username || user.displayName || user.email || (user.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"),
        role: user.role || "user"
      },
      timestamp: Date.now(),
      status: "accepted",
    };

    // Update both call references
    await Promise.all([
      set(callRef, callData),
      set(callerRef, callData)
    ]);

    // Generate Jitsi URL immediately
    const jitsiUrl = generateJitsiUrl(incomingCall.uid, user.uid);

    // Update local states
    setJitsiUrl(jitsiUrl);
    setIsCalling(true);
    setIncomingCall(null);
    setReceiver(incomingCall);

    console.log("Call accepted successfully");
  } catch (error) {
    console.error("Error accepting call:", error);
    throw error;
  }
};

// Function to decline call
export const declineCall = async (incomingCall, user, dbCall, setCallStates) => {
  if (!incomingCall || !user) {
    console.error("Missing required data for declining call");
    return;
  }

  const {
    setIncomingCall,
    setReceiver,
  } = setCallStates;

  try {
    const userSafeKey = safeKey(user.uid);
    const callerSafeKey = safeKey(incomingCall.uid);

    const callRef = ref(dbCall, `calls/${userSafeKey}`);
    const callerRef = ref(dbCall, `calls/${callerSafeKey}`);

    const callData = {
      from: incomingCall,
      to: user,
      timestamp: Date.now(),
      status: "declined",
    };

    // Update both references to show declined status
    await Promise.all([
      set(callRef, callData),
      set(callerRef, callData)
    ]);

    // Clean up after a short delay
    setTimeout(async () => {
      try {
        await Promise.all([
          remove(callRef),
          remove(callerRef)
        ]);
      } catch (error) {
        console.error("Error cleaning up declined call:", error);
      }
    }, 2000);

    // Update local states
    setIncomingCall(null);
    setReceiver(null);

    console.log("Call declined successfully");
  } catch (error) {
    console.error("Error declining call:", error);
    throw error;
  }
};

// Function to end call
export const endCall = async (receiver, isInitiator, user, dbCall, setCallStates) => {
  const {
    setIsCalling,
    setIncomingCall,
    setIsInitiator,
    setReceiver,
    setJitsiUrl
  } = setCallStates;

  try {
    const promises = [];

    if (receiver?.uid) {
      const receiverRef = ref(dbCall, `calls/${safeKey(receiver.uid)}`);
      promises.push(remove(receiverRef));
    }

    if (user?.uid) {
      const userRef = ref(dbCall, `calls/${safeKey(user.uid)}`);
      promises.push(remove(userRef));
    }

    // Wait for all Firebase operations to complete
    if (promises.length > 0) {
      await Promise.all(promises);
    }

    console.log("Call ended successfully");
  } catch (error) {
    console.error("Error ending call:", error);
    // Don't throw error here - we want to clean up local state regardless
  } finally {
    // Always reset local states
    setIsCalling(false);
    setIncomingCall(null);
    setIsInitiator(false);
    setReceiver(null);
    setJitsiUrl(null);
  }
};

// Function to create call
export const createCall = async (caller, callee, dbCall, setCallStates) => {
  if (!caller?.uid || !callee?.uid) {
    console.error("Thiếu UID của caller hoặc callee");
    return;
  }

  const {
    setIsCalling,
    setIsInitiator,
    setReceiver
  } = setCallStates;

  setIsCalling(true);
  setIsInitiator(true);
  setReceiver(callee);

  const callRef = ref(dbCall, `calls/${safeKey(callee.uid)}`);

  const callData = {
    from: {
      uid: caller.uid,
      username: caller.displayName || caller.email || (caller.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"),
      role: caller.role || "user"
    },
    to: {
      uid: callee.uid,
      username: callee.name || callee.username || (callee.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"),
      role: callee.role || "user"
    },
    timestamp: Date.now(),
    status: "pending",
  };

  try {
    await set(callRef, callData);
  } catch (err) {
    console.error("Lỗi khi ghi dữ liệu cuộc gọi:", err);
    // Reset state nếu gọi thất bại
    setIsCalling(false);
    setIsInitiator(false);
    setReceiver(null);
  }
};

// Hàm tạo Jitsi URL
export const generateJitsiUrl = (fromUid, toUid) => {
  const members = [fromUid, toUid];
  const membersString = members.join("-").replaceAll(/[.#$[\]]/g, '_');
  return `https://meet.jit.si/${membersString}`;
};

// Function to check call status
export const checkCallStatus = async (uid, dbCall) => {
  if (!uid) return null;

  try {
    const callRef = ref(dbCall, `calls/${safeKey(uid)}`);
    const snapshot = await get(callRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error checking call status:", error);
    return null;
  }
};

// Function to cleanup stale calls
export const cleanupStaleCall = async (uid, dbCall) => {
  if (!uid) return;

  try {
    const callRef = ref(dbCall, `calls/${safeKey(uid)}`);
    await remove(callRef);
    console.log("Cleaned up stale call for user:", uid);
  } catch (error) {
    console.error("Error cleaning up stale call:", error);
  }
};