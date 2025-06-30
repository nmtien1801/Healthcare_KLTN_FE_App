import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

const OverviewTab = () => {
  const handlePress = () => {
    Alert.alert('Chào bạn!', 'Bạn đã nhấn nút.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với OverviewTab!</Text>
      <Text style={styles.text}>Đây là màn hình React Native cơ bản.</Text>
      <Button title="Nhấn tôi" onPress={handlePress} color="#2196F3" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#2196F3',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default OverviewTab;
