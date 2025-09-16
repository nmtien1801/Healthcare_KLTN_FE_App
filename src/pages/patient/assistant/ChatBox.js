import React, { useState, useRef } from "react"; 
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Image } from "react-native";

const ChatBox = () => {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: '💉 Xin chào! Vui lòng nhập thông tin bệnh nhân để dự đoán hoặc đặt câu hỏi.' }
  ]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    // Giả lập bot trả lời
    setTimeout(() => {
      const botMessage = { id: Date.now().toString() + "_bot", sender: 'bot', text: '🤖 Đây là phản hồi từ bot.' };
      setMessages(prev => [...prev, botMessage]);
      flatListRef.current.scrollToEnd({ animated: true });
    }, 500);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageRow, item.sender === 'bot' ? styles.botRow : styles.userRow]}>
      {item.sender === 'bot' && (
        <Image 
          source={{ uri: 'https://i.imgur.com/8Km9tLL.png' }} // URL avatar bot
          style={styles.avatar}
        />
      )}
      <View style={[styles.messageBubble, item.sender === 'bot' ? styles.botBubble : styles.userBubble]}>
        <Text style={item.sender === 'bot' ? styles.botText : styles.userText}>{item.text}</Text>
      </View>
      {item.sender === 'user' && (
        <Image 
          source={{ uri: 'https://i.imgur.com/7k12EPD.png' }} // URL avatar user
          style={styles.avatar}
        />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập câu hỏi về bệnh tiểu đường..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  botRow: { justifyContent: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  messageBubble: { padding: 12, borderRadius: 12, maxWidth: "70%" },
  botBubble: { backgroundColor: "#4fa3ff", borderTopLeftRadius: 0, marginLeft: 8 },
  userBubble: { backgroundColor: "#e5e5e5", borderTopRightRadius: 0, marginRight: 8 },
  botText: { color: "#fff" },
  userText: { color: "#000" },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  inputContainer: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderColor: "#ccc", backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 12, height: 40 },
  sendButton: { backgroundColor: "#007bff", borderRadius: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, marginLeft: 8 },
  sendText: { color: "#fff", fontWeight: "bold" },
});

export default ChatBox;
