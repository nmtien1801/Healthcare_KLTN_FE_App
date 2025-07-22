import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const Header = () => {
  const [notifications, setNotifications] = useState(5);

  return (
    <View style={styles.header}>
      {/* Logo & Title */}
      <View style={styles.leftSection}>
        <FontAwesome name="heartbeat" size={24} color="#0d6efd" style={styles.icon} />
        <Text style={styles.title}>HealthCare AI</Text>
      </View>

      {/* Notifications & Info */}
      <View style={styles.rightSection}>
        {/* Notification Bell */}
        <TouchableOpacity style={styles.notificationContainer}>
          <FontAwesome name="bell" size={20} color="#6c757d" />
          {notifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notifications}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Doctor Info */}
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>BS. Nguyễn Văn An</Text>
          <Text style={styles.doctorDept}>Khoa Tim mạch</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: "https://readdy.ai/api/search-image?query=professional%20male%20doctor%20portrait%2C%20asian%20doctor%2C%20wearing%20white%20coat%2C%20stethoscope%2C%20friendly%20smile%2C%20high%20quality%2C%20studio%20lighting%2C%20medical%20professional%2C%20isolated%20on%20light%20blue%20background%2C%20centered%20composition&width=50&height=50&seq=doctor1&orientation=squarish",
            }}
            style={styles.avatar}
          />
          <View style={styles.onlineIndicator}></View>
        </View>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    elevation: 3, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 1050,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0d6efd",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationContainer: {
    marginRight: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "red",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  doctorInfo: {
    marginRight: 16,
    alignItems: "flex-end",
  },
  doctorName: {
    fontWeight: "500",
    fontSize: 14,
  },
  doctorDept: {
    fontSize: 12,
    color: "#6c757d",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0d6efd",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: "#28a745",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
