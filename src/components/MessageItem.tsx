import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext'; // To determine if message is sent or received
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { user } = useAuth();
  const isMyMessage = message.senderId === user?.id;

  return (
    <View style={[styles.container, isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer]}>
      <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
        {message.type === 'TEXT' && <Text style={isMyMessage ? styles.myText : styles.theirText}>{message.content}</Text>}
        {message.type === 'VOICE' && <Text style={isMyMessage ? styles.myText : styles.theirText}>🎤 Voice Note (Playback UI Needed)</Text>}
         {message.type === 'SYSTEM' && <Text style={styles.systemText}>{message.content}</Text>}
        {/* Add timestamp */}
        <Text style={styles.timestamp}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  myBubble: {
    backgroundColor: 'dodgerblue',
  },
  theirBubble: {
    backgroundColor: '#e5e5ea',
  },
  myText: {
    color: 'white',
  },
  theirText: {
    color: 'black',
  },
   systemText: {
       color: '#666',
       fontStyle: 'italic',
       fontSize: 12,
       alignSelf: 'center',
   },
  timestamp: {
    fontSize: 10,
    color: '#999', // Adjust color based on bubble
    alignSelf: 'flex-end',
    marginTop: 2,
  },
});

export default MessageItem;