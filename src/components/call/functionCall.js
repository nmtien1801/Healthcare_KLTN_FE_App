import {
  ref,
  set,
  remove,
} from "firebase/database";

// Hàm helper để tạo key an toàn cho Firebase
export const safeKey = (str) => {
  return str.replace(/[.#$[\]]/g, '_');
};

// Hàm chấp nhận cuộc gọi
export const acceptCall = async (incomingCall, user, dbCall, setCallStates) => {
  if (!incomingCall || !user) return;

  const {
    setIsCalling,
    setIncomingCall,
    setReceiver,
    setJitsiUrl
  } = setCallStates;

  setIsCalling(true);
  setIncomingCall(null);

  const callRef = ref(dbCall, `calls/${safeKey(user.uid)}`);
  const callerRef = ref(dbCall, `calls/${safeKey(incomingCall.uid)}`);

  const callData = {
    from: incomingCall,
    to: { 
      uid: user.uid,
      username: user.displayName || user.email || (user.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"),
      role: user.role || "user"
    },
    timestamp: Date.now(),
    status: "accepted",
  };

  try {
    await set(callRef, callData);
    await set(callerRef, callData);
  } catch (err) {
    console.error("Lỗi khi chấp nhận cuộc gọi:", err);
  }
};

// Hàm kết thúc cuộc gọi
export const endCall = async (receiver, isInitiator, user, dbCall, setCallStates) => {
  const {
    setIsCalling,
    setIncomingCall,
    setIsInitiator,
    setReceiver,
    setJitsiUrl
  } = setCallStates;

  try {
    if (receiver && receiver.uid) {
      const callRef = ref(dbCall, `calls/${safeKey(receiver.uid)}`);
      await remove(callRef);
    }
    if (isInitiator && user && user.uid) {
      const callerRef = ref(dbCall, `calls/${safeKey(user.uid)}`);
      await remove(callerRef);
    }
  } catch (err) {
    console.error("Lỗi khi kết thúc cuộc gọi:", err);
  }

  setIsCalling(false);
  setIncomingCall(null);
  setIsInitiator(false);
  setReceiver(null);
  setJitsiUrl(null);
};

// Hàm tạo cuộc gọi
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
