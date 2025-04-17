import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DiscoverScreen = () => {
  // TODO: Implement fetching potential matches/opening questions
  // Display them in a card-like format (e.g., Tinder-style swipe or list)
  // Allow user to answer the opening question to initiate a match (needs backend logic)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Matches</Text>
      <Text>Potential matches based on interests and opening questions will appear here.</Text>
      {/* Add Card Swiper or List component here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
   title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
});

export default DiscoverScreen;