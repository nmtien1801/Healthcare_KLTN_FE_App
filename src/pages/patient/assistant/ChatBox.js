import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { api } from "../../../apis/assistant";

const ChatBox = () => {
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "👋 Xin chào! Tôi là trợ lý AI chuyên về bệnh tiểu đường. Bạn có thể đặt câu hỏi về:\n• Triệu chứng và chẩn đoán\n• Điều trị và thuốc\n• Chế độ ăn uống\n• Lối sống khỏe mạnh\n\nHãy đặt câu hỏi bất kỳ!",
        },
    ]);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef(null);

    // Auto scroll to bottom when new message added
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const handleAsk = async () => {
        if (!question.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập câu hỏi!");
            return;
        }

        const userMessage = { sender: "user", text: question.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        const currentQuestion = question;
        setQuestion("");

        try {
            const res = await api.post("/ask", { query: currentQuestion });
            const botMessage = { 
                sender: "bot", 
                text: res.data.answer || "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này." 
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (err) {
            console.error(err);
            const errorMessage = {
                sender: "bot",
                text: "🤖 Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau ít phút.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        Alert.alert(
            "Xóa cuộc trò chuyện",
            "Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => {
                        setMessages([
                            {
                                sender: "bot",
                                text: "👋 Xin chào! Tôi là trợ lý AI chuyên về bệnh tiểu đường. Bạn có thể đặt câu hỏi về:\n• Triệu chứng và chẩn đoán\n• Điều trị và thuốc\n• Chế độ ăn uống\n• Lối sống khỏe mạnh\n\nHãy đặt câu hỏi bất kỳ!",
                            },
                        ]);
                    },
                },
            ]
        );
    };

    const formatTimestamp = () => {
        const now = new Date();
        return now.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const renderMessage = (msg, index) => {
        const isUser = msg.sender === "user";
        const isLastMessage = index === messages.length - 1;
        
        return (
            <View
                key={index}
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.botMessageContainer,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isUser ? styles.userMessage : styles.botMessage,
                        isLastMessage && isUser && styles.lastUserMessage,
                        isLastMessage && !isUser && styles.lastBotMessage,
                    ]}
                >
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userMessageText : styles.botMessageText
                    ]}>
                        {msg.text}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        isUser ? styles.userTimestamp : styles.botTimestamp
                    ]}>
                        {formatTimestamp()}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🤖 Trợ lý AI</Text>
                    <Text style={styles.headerSubtitle}>Chuyên gia tiểu đường</Text>
                </View>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearChat}
                >
                    <Text style={styles.clearButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map(renderMessage)}
                
                {/* Loading indicator */}
                {loading && (
                    <View style={[styles.messageContainer, styles.botMessageContainer]}>
                        <View style={[styles.messageBubble, styles.botMessage, styles.loadingMessage]}>
                            <ActivityIndicator size="small" color="#3B82F6" />
                            <Text style={styles.loadingText}>Đang suy nghĩ...</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input Section */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Nhập câu hỏi về bệnh tiểu đường..."
                    value={question}
                    onChangeText={setQuestion}
                    multiline={true}
                    maxLength={500}
                    editable={!loading}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!question.trim() || loading) && styles.sendButtonDisabled
                    ]}
                    onPress={handleAsk}
                    disabled={!question.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.sendButtonText}>📤</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => setQuestion("Triệu chứng tiểu đường type 2 là gì?")}
                    >
                        <Text style={styles.quickActionText}>🩺 Triệu chứng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => setQuestion("Chế độ ăn cho người tiểu đường")}
                    >
                        <Text style={styles.quickActionText}>🥗 Chế độ ăn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => setQuestion("Cách kiểm soát đường huyết")}
                    >
                        <Text style={styles.quickActionText}>📊 Kiểm soát</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => setQuestion("Tập thể dục cho người tiểu đường")}
                    >
                        <Text style={styles.quickActionText}>🏃 Tập luyện</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    clearButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
    },
    clearButtonText: {
        fontSize: 18,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messagesContent: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        marginBottom: 12,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    botMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userMessage: {
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    lastUserMessage: {
        borderBottomRightRadius: 18,
    },
    lastBotMessage: {
        borderBottomLeftRadius: 18,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: 'white',
    },
    botMessageText: {
        color: '#1F2937',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
        opacity: 0.7,
    },
    userTimestamp: {
        color: 'white',
        alignSelf: 'flex-end',
    },
    botTimestamp: {
        color: '#6B7280',
        alignSelf: 'flex-start',
    },
    loadingMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    loadingText: {
        marginLeft: 8,
        color: '#6B7280',
        fontSize: 14,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        maxHeight: 100,
        backgroundColor: '#F9FAFB',
        marginRight: 12,
        color: '#1F2937',
    },
    sendButton: {
        backgroundColor: '#3B82F6',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    sendButtonText: {
        fontSize: 18,
        color: 'white',
    },
    quickActions: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    quickActionButton: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    quickActionText: {
        color: '#2563EB',
        fontSize: 13,
        fontWeight: '500',
    },
});

export default ChatBox;