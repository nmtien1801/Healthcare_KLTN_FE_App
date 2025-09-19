import React, { useState, useEffect, useRef } from "react";
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Platform,
  Alert,
  Dimensions,
  StatusBar,
  BackHandler
} from "react-native";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get('window');

// Modal displaying Jitsi using WebView (React Native)
const VideoCallModal = ({ jitsiUrl, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const webViewRef = useRef(null);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        "Kết thúc cuộc gọi",
        "Bạn có muốn kết thúc cuộc gọi không?",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Kết thúc", style: "destructive", onPress: onClose }
        ]
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [onClose]);

  const handleWebViewLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(nativeEvent.description || 'Không thể tải cuộc gọi video');
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleCloseConfirm = () => {
    Alert.alert(
      "Kết thúc cuộc gọi",
      "Bạn có chắc chắn muốn kết thúc cuộc gọi không?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Kết thúc", style: "destructive", onPress: onClose }
      ]
    );
  };

  // Jitsi configuration for better mobile experience
  const jitsiConfig = {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    enableClosePage: false,
    prejoinPageEnabled: false,
    disableInviteFunctions: true,
    disableAddingParticipants: true,
    enableNoisyMicDetection: false,
    resolution: 480,
    constraints: {
      video: {
        aspectRatio: 16 / 9,
        height: {
          ideal: 480,
          max: 720,
          min: 240
        }
      }
    }
  };

  const injectedJavaScript = `
    // Configure Jitsi for mobile
    window.addEventListener('load', function() {
      if (window.JitsiMeetJS) {
        // Mobile optimizations
        const config = ${JSON.stringify(jitsiConfig)};
        if (window.APP && window.APP.conference) {
          Object.assign(window.APP.conference._room.options.config, config);
        }
      }
    });

    // Prevent zoom and improve touch handling
    document.addEventListener('gesturestart', function(e) {
      e.preventDefault();
    });
    
    // Hide Jitsi toolbar items that aren't needed on mobile
    setTimeout(() => {
      const elementsToHide = [
        '.invite-more-dialog',
        '.add-people-dialog',
        '.embed-meeting-dialog'
      ];
      elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.style.display = 'none');
      });
    }, 3000);

    true; // Required for injectedJavaScript
  `;

  return (
    <Modal 
      transparent 
      animationType="fade" 
      visible={true}
      onRequestClose={handleCloseConfirm}
    >
      <StatusBar hidden={true} />
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleCloseConfirm} 
              style={styles.closeBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Main content */}
          <View style={styles.body}>
            {!jitsiUrl ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Đang chuẩn bị cuộc gọi...</Text>
              </View>
            ) : hasError ? (
              <View style={styles.errorWrap}>
                <Text style={styles.errorTitle}>Lỗi kết nối</Text>
                <Text style={styles.errorText}>
                  {errorMessage || 'Không thể kết nối đến cuộc gọi video'}
                </Text>
                <View style={styles.errorButtons}>
                  <TouchableOpacity 
                    onPress={handleRetry} 
                    style={[styles.button, styles.retryButton]}
                  >
                    <Text style={styles.buttonText}>Thử lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={onClose} 
                    style={[styles.button, styles.cancelButton]}
                  >
                    <Text style={styles.buttonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {isLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Đang tải cuộc gọi video...</Text>
                  </View>
                )}
                <WebView
                  ref={webViewRef}
                  source={{ uri: jitsiUrl }}
                  style={[styles.webview, { opacity: isLoading ? 0 : 1 }]}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlaybook={true}
                  mediaPlaybackRequiresUserAction={false}
                  originWhitelist={["*"]}
                  allowsFullscreenVideo={true}
                  allowsBackForwardNavigationGestures={false}
                  bounces={false}
                  scrollEnabled={false}
                  onLoad={handleWebViewLoad}
                  onError={handleWebViewError}
                  onHttpError={handleWebViewError}
                  injectedJavaScript={injectedJavaScript}
                  userAgent={Platform.select({
                    android: "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
                    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
                  })}
                  mixedContentMode="always"
                  thirdPartyCookiesEnabled={true}
                  sharedCookiesEnabled={true}
                  startInLoadingState={false}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#000",
    borderRadius: Platform.OS === 'ios' ? 12 : 0,
    width: width,
    height: height,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Account for status bar
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoCallModal;