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
    console.error("Missing UID for caller or callee");
    throw new Error("Missing required user information");
  }

  const {
    setIsCalling,
    setIsInitiator,
    setReceiver
  } = setCallStates;

  try {
    const calleeSafeKey = safeKey(callee.uid);
    const callRef = ref(dbCall, `calls/${calleeSafeKey}`);
    
    // Check if there's already an active call for the callee
    const existingCallSnapshot = await get(callRef);
    if (existingCallSnapshot.exists()) {
      const existingCall = existingCallSnapshot.val();
      if (existingCall.status === "pending" || existingCall.status === "accepted") {
        throw new Error("User is already in a call");
      }
    }

    const callData = {
      from: { 
        uid: caller.uid,
        username: caller.username || caller.displayName || caller.email || (caller.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"),
        role: caller.role || "user"
      },
      to: { 
        uid: callee.uid,
        username: callee.username || callee.name || callee.displayName || callee.email || (callee.role === "doctor" ? "Bác sĩ" : "Bệnh nhân"),
        role: callee.role || "user"
      },
      timestamp: Date.now(),
      status: "pending",
    };

    await set(callRef, callData);

    // Update local states
    setIsCalling(false); // Will be set to true when accepted
    setIsInitiator(true);
    setReceiver(callee);

    console.log("Call created successfully");
  } catch (error) {
    console.error("Error creating call:", error);
    
    // Reset states on failure
    setIsCalling(false);
    setIsInitiator(false);
    setReceiver(null);
    
    throw error;
  }
};

// Function to generate Jitsi URL
export const generateJitsiUrl = (fromUid, toUid) => {
  if (!fromUid || !toUid) {
    console.error("Missing UIDs for generating Jitsi URL");
    return null;
  }

  try {
    // Create a consistent room name regardless of who calls whom
    const members = [fromUid, toUid].sort(); // Sort to ensure consistency
    const roomName = members
      .join("-")
      .replace(/[.#$[\]@]/g, '_') // Remove special characters
      .toLowerCase();
    
    // Add timestamp to make room unique for each call session
    const timestamp = Date.now();
    const uniqueRoomName = `${roomName}-${timestamp}`;
    
    const jitsiUrl = `https://meet.jit.si/${uniqueRoomName}`;
    console.log("Generated Jitsi URL:", jitsiUrl);
    
    return jitsiUrl;
  } catch (error) {
    console.error("Error generating Jitsi URL:", error);
    return null;
  }
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