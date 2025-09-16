import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { getAuth, signOut } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Header = () => {
  const auth = getAuth();
  const [notifications, setNotifications] = useState(5);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const avatarRef = useRef(null);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const openMenu = () => {
    avatarRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setMenuPosition({ top: pageY + height + 4, left: pageX - 130 });
      setShowMenu(true);
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase sign out
      await dispatch(logout()); // Xóa Redux user

      AsyncStorage.removeItem("access_Token");
      // AsyncStorage.removeItem("refresh_Token");

      navigation.navigate("Login");
    } catch (error) {
      console.error("Lỗi khi logout:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi đăng xuất.");
    }
  };

  const handleChangePassword = () => {
    navigation.navigate("ChangePassword");
  };

  return (
    <View style={styles.container}>
      {/* Logo & Title */}
      <View style={styles.left}>
        <Icon name="heartbeat" size={24} color="#007bff" style={styles.icon} />
        <Text style={styles.title}>HealthCare AI</Text>
      </View>

      {/* Notifications & Info */}
      <View style={styles.right}>
        <View style={styles.notificationContainer}>
          <Icon name="bell" size={20} color="#6c757d" />
          {notifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notifications}</Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>BS. Nguyễn Văn An</Text>
          <Text style={styles.userDept}>Khoa Tim mạch</Text>
        </View>

        {/* Avatar + Dropdown */}
        <TouchableOpacity ref={avatarRef} onPress={openMenu}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: "https://readdy.ai/api/search-image?query=professional%20male%20doctor%20portrait%2C%20asian%20doctor%2C%20wearing%20white%20coat%2C%20stethoscope%2C%20friendly%20smile%2C%20high%20quality%2C%20studio%20lighting%2C%20medical%20professional%2C%20isolated%20on%20light%20blue%20background%2C%20centered%20composition&width=50&height=50&seq=doctor1&orientation=squarish",
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineDot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={[
              styles.menu,
              {
                top: menuPosition.top,
                left: menuPosition.left,
              },
            ]}
          >
            <Pressable onPress={() => navigation.navigate("PersonalTabs")} style={styles.menuItem}>
              <Text>Thông tin các nhân</Text>
            </Pressable>
            <Pressable onPress={handleChangePassword} style={styles.menuItem}>
              <Text>Đổi mật khẩu</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={handleLogout} style={styles.menuItem}>
              <Text>Đăng xuất</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 100,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007bff",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationContainer: {
    marginRight: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
  },
  userInfo: {
    marginRight: 16,
  },
  userName: {
    fontWeight: "500",
  },
  userDept: {
    fontSize: 12,
    color: "#6c757d",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#007bff",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: "green",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#fff",
  },
  menu: {
    position: "absolute",
    backgroundColor: "#fff",
    width: 160,
    borderRadius: 6,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 999,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 4,
  },
});

export default Header;
