import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';
import { Message, ChatProgress, User } from '../../types';
import MessageItem from '../../components/MessageItem';
import ProgressBar from '../../components/ProgressBar';
import api, { getMessagesForMatch, getRevealedName, getRevealedInterestPhoto, getRevealedMainPhoto, submitVibeCheck } from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId } = route.params;
  const { user } = useAuth();
  const { isConnected, sendMessage, addMessageListener, removeMessageListener } = useWebSocket(); // Use the hook

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatProgress, setChatProgress] = useState<ChatProgress | null>(null); // Store progress data
  const [revealedData, setRevealedData] = useState<{ name?: string, interestPhotoUrl?: string, mainPhotoUrl?: string }>({});
  const [isSubmittingVibe, setIsSubmittingVibe] = useState(false);
  const [vibeOutcome, setVibeOutcome] = useState<'pending' | 'success' | 'mismatch' | null>(null); // Track vibe outcome

  const flatListRef = useRef<FlatList>(null);

  // Fetch initial data and progress
  const loadChatData = useCallback(async () => {
    setIsLoading(true);
    try {
        // TODO: Need backend endpoints for fetching messages and current progress
        // const messagesRes = await getMessagesForMatch(matchId); // Needs backend endpoint
        // const progressRes = await api.get(`/matches/${matchId}/progress`); // Needs backend endpoint

        // Placeholder data:
        const initialMessages: Message[] = []; // messagesRes.data;
        const initialProgress: ChatProgress | null = null; // progressRes.data;

        setMessages(initialMessages);
        setChatProgress(initialProgress);

        // Pre-fetch revealed data if checkpoints already reached
        if (initialProgress?.checkpoint1Reached) fetchRevealedInfo(1);
        if (initialProgress?.checkpoint2Reached) fetchRevealedInfo(2);
        if (initialProgress?.checkpoint3Reached) fetchRevealedInfo(3);


    } catch (error) {
      console.error("Failed to load chat data:", error);
      Alert.alert("Error", "Could not load chat data.");
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadChatData();
    // Join the WebSocket room for this match when component mounts
    sendMessage('joinMatchRoom', matchId);

    // --- Setup WebSocket Listeners ---
    const handleNewMessage = (message: Message) => {
      if (message.matchId === matchId) { // Ensure message is for this chat
        setMessages((prevMessages) => [...prevMessages, message]);
        // TODO: Also update progress locally or re-fetch progress based on socket event
      }
    };

    // TODO: Add listeners for 'checkpointReached' and 'vibeCheckUpdate' from WebSocket
    // Example:
    // const handleCheckpointReached = (data: { matchId: string, stage: number }) => {
    //    if (data.matchId === matchId) {
    //       setChatProgress(prev => ({ ...prev, [`checkpoint${data.stage}Reached`]: true })); // Optimistic update or re-fetch
    //    }
    // }
    // const handleVibeUpdate = (data: { matchId: string, outcome: string }) => { ... setVibeOutcome(data.outcome) ... }

    addMessageListener(handleNewMessage);
    // addCheckpointListener(handleCheckpointReached);
    // addVibeListener(handleVibeUpdate);

    // Cleanup on unmount
    return () => {
      sendMessage('leaveMatchRoom', matchId);
      removeMessageListener(handleNewMessage);
      // removeCheckpointListener(...)
      // removeVibeListener(...)
    };
  }, [matchId, sendMessage, addMessageListener, removeMessageListener, loadChatData]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Timeout helps ensure layout is complete before scrolling
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim() === '' || !isConnected) {
      return;
    }
     if (vibeOutcome === 'mismatch') { // Don't allow sending if mismatch
        Alert.alert("Chat Closed", "This chat was closed due to a mismatch.");
        return;
    }

    sendMessage('sendMessage', { matchId: matchId, content: newMessage });
    // Optimistic UI update (optional)
    // const optimisticMessage: Message = { ... }
    // setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
  };

  // --- Reveal Logic ---
  const fetchRevealedInfo = async (stage: 1 | 2 | 3) => {
      try {
           let response;
           if (stage === 1) response = await getRevealedName(matchId);
           if (stage === 2) response = await getRevealedInterestPhoto(matchId);
           if (stage === 3) response = await getRevealedMainPhoto(matchId);

           if (response) {
               setRevealedData(prev => ({ ...prev, ...response.data }));
           }
      } catch (error: any) {
          console.error(`Failed to fetch reveal data stage ${stage}:`, error.response?.data || error.message);
          // Don't show alert for trying to fetch before ready
          if(error.response?.status !== 403) {
             Alert.alert("Error", `Could not reveal information for stage ${stage}.`);
          }
      }
  };

  // --- Vibe Check Logic ---
  const handleVibe = async (choice: 'YES' | 'NO') => {
        if (!chatProgress?.checkpoint3Reached) return; // Should not happen if button isn't visible
        setIsSubmittingVibe(true);
        try {
            await submitVibeCheck(matchId, choice);
            // Outcome will be handled by the 'vibeCheckUpdate' WebSocket listener
             Alert.alert("Vibe Submitted", "Waiting for the other person...");
        } catch (error: any) {
             console.error("Failed to submit vibe check:", error.response?.data || error.message);
             Alert.alert("Error", "Could not submit vibe choice.");
        } finally {
            setIsSubmittingVibe(false);
        }
    };

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  const canVibe = chatProgress?.checkpoint3Reached && vibeOutcome !== 'mismatch' && vibeOutcome !== 'success';
  const showVibeButtons = canVibe // && myVibeChoice === 'PENDING' // Need to know own choice state


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Adjust offset as needed
    >
        {/* Header Area for Progress and Reveals */}
         <View style={styles.header}>
            {chatProgress && (
                 <ProgressBar
                    currentScore={chatProgress.score}
                    checkpoint1Reached={chatProgress.checkpoint1Reached}
                    checkpoint2Reached={chatProgress.checkpoint2Reached}
                    checkpoint3Reached={chatProgress.checkpoint3Reached}
                />
            )}
            {/* Display Revealed Info */}
            <View style={styles.revealSection}>
                 {chatProgress?.checkpoint1Reached && <Button title={revealedData.name ? `Name: ${revealedData.name}` : "Reveal Name"} onPress={() => fetchRevealedInfo(1)} disabled={!!revealedData.name} />}
                 {chatProgress?.checkpoint2Reached && <Button title={revealedData.interestPhotoUrl ? "Interest Photo ✓" : "Reveal Interest Photo"} onPress={() => fetchRevealedInfo(2)} disabled={!!revealedData.interestPhotoUrl} />}
                 {revealedData.interestPhotoUrl && <Image source={{ uri: revealedData.interestPhotoUrl }} style={styles.revealImage} />}
                 {chatProgress?.checkpoint3Reached && <Button title={revealedData.mainPhotoUrl ? "Main Photo ✓" : "Reveal Main Photo"} onPress={() => fetchRevealedInfo(3)} disabled={!!revealedData.mainPhotoUrl} />}
                  {revealedData.mainPhotoUrl && <Image source={{ uri: revealedData.mainPhotoUrl }} style={styles.revealImage} />}
            </View>

             {/* Vibe Check Buttons */}
              {showVibeButtons && (
                <View style={styles.vibeSection}>
                    <Text>Reveal Complete! Still feeling the vibe?</Text>
                    <View style={styles.vibeButtons}>
                        <Button title="Yes!" onPress={() => handleVibe('YES')} disabled={isSubmittingVibe}/>
                        <Button title="No" onPress={() => handleVibe('NO')} disabled={isSubmittingVibe} color="red"/>
                    </View>
                </View>
             )}
              {vibeOutcome === 'mismatch' && <Text style={styles.vibeResultText}>Chat closed: Mismatch.</Text>}
              {vibeOutcome === 'success' && <Text style={styles.vibeResultText}>Vibe check success!</Text>}

         </View>


      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageItem message={item} />}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={{ paddingBottom: 10 }} // Add padding at the bottom
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })} // Try scrolling on size change
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })} // Try scrolling on layout
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={vibeOutcome === 'mismatch' ? "Chat closed" : "Type a message..."}
          editable={isConnected && vibeOutcome !== 'mismatch'} // Disable if not connected or mismatched
        />
        <Button title="Send" onPress={handleSend} disabled={!isConnected || newMessage.trim() === '' || vibeOutcome === 'mismatch'} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
     padding: 5,
     borderBottomWidth: 1,
     borderBottomColor: '#ccc',
     backgroundColor: 'white',
   },
   revealSection: {
       flexDirection: 'row',
       justifyContent: 'space-around',
       alignItems: 'center',
       flexWrap: 'wrap',
       paddingVertical: 5,
   },
   revealImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 5,
   },
   vibeSection: {
       alignItems: 'center',
       paddingVertical: 10,
       borderTopWidth: 1,
       borderTopColor: '#eee',
       marginTop: 5,
   },
   vibeButtons: {
       flexDirection: 'row',
       justifyContent: 'space-around',
       width: '60%',
       marginTop: 5,
   },
   vibeResultText: {
       marginTop: 5,
       fontWeight: 'bold',
       color: 'green', // Change color for mismatch
   },
  messageList: {
    flex: 1, // Takes up available space
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: 'white', // Match header background
  },
  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#fff', // White input background
  },
});

export default ChatScreen;