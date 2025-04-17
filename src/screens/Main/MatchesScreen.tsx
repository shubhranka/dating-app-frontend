import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, RefreshControl } from 'react-native';
import { ParamListRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack'; // Or BottomTabScreenProps if directly in tab
import { MainStackParamList } from '../../navigation/MainNavigator'; // Define this type
import { getPendingMatches, getActiveMatches } from '../../services/api';
import { Match } from '../../types'; // Import Match type

// Define param list for navigation within the Main stack/tab
type Props = NativeStackScreenProps<MainStackParamList, 'MatchesList'>; // Adjust type based on navigator

const MatchesScreen: React.FC<Props> = ({ navigation }) => {
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, activeRes] = await Promise.all([
        getPendingMatches(),
        getActiveMatches()
      ]);
      setPendingMatches(pendingRes.data);
      setActiveMatches(activeRes.data);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      // Handle error display
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch matches when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches().finally(() => setRefreshing(false));
  }, []);

  const renderMatchItem = ({ item }: { item: Match }) => {
     // Determine the other user for display purposes
     // const otherUser = item.user1?.id === currentUser?.id ? item.user2 : item.user1; // Need currentUser from context
    return (
        <View style={styles.matchItem}>
            <Text>Match with User {item.user1Id === 'MY_ID_PLACEHOLDER' ? item.user2Id.substring(0,5) : item.user1Id.substring(0,5)}...</Text>
            <Text>Status: {item.status}</Text>
             {/* Display opening question if pending, or last message if active */}
            <Button title="Open Chat" onPress={() => navigation.navigate('Chat', { matchId: item.id })} />
        </View>
    )
  };


  if (isLoading && !refreshing) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
       {/* Using Nested FlatLists is generally discouraged for performance.
           Consider using SectionList or combining data if possible.
           This is a simplified example. */}
      <Text style={styles.header}>Pending Matches</Text>
      <FlatList
        data={pendingMatches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending matches found.</Text>}
        style={styles.list}
        refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }
      />
      <Text style={styles.header}>Active Chats</Text>
      <FlatList
        data={activeMatches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No active chats found.</Text>}
         style={styles.list}
          refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> } // Share refresh control or separate
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    marginLeft: 10,
  },
   list: {
     flex: 1, // Make lists take available space
   },
  matchItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'grey',
  },
});

export default MatchesScreen;