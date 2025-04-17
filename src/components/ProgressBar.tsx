import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CHECKPOINT_1_SCORE, CHECKPOINT_2_SCORE, CHECKPOINT_3_SCORE, MAX_PROGRESS_SCORE } from '../utils/constants'; // Use actual max value

interface ProgressBarProps {
  currentScore: number;
  checkpoint1Reached: boolean;
  checkpoint2Reached: boolean;
  checkpoint3Reached: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentScore,
  checkpoint1Reached,
  checkpoint2Reached,
  checkpoint3Reached,
}) => {
  const progress = Math.min(currentScore / MAX_PROGRESS_SCORE, 1); // Cap at 100%

  const getCheckpointStyle = (reached: boolean) => ({
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: reached ? 'gold' : 'grey',
      marginHorizontal: 2,
  });

  // Calculate positions for markers (approximate)
  const cp1Pos = (CHECKPOINT_1_SCORE / MAX_PROGRESS_SCORE) * 100;
  const cp2Pos = (CHECKPOINT_2_SCORE / MAX_PROGRESS_SCORE) * 100;
  const cp3Pos = (CHECKPOINT_3_SCORE / MAX_PROGRESS_SCORE) * 100;


  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>Progress: {currentScore} / {MAX_PROGRESS_SCORE}</Text>
      <View style={styles.barContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        {/* Checkpoint markers */}
        <View style={[styles.checkpointMarker, { left: `${cp1Pos}%` }, getCheckpointStyle(checkpoint1Reached)]} />
        <View style={[styles.checkpointMarker, { left: `${cp2Pos}%` }, getCheckpointStyle(checkpoint2Reached)]} />
        <View style={[styles.checkpointMarker, { left: `${cp3Pos}%` }, getCheckpointStyle(checkpoint3Reached)]} />
      </View>
       {/* Optional: Add labels for checkpoints */}
       <View style={styles.checkpointLabels}>
            <Text style={[styles.label, {left: `${cp1Pos}%`}]}>👤</Text>
            <Text style={[styles.label, {left: `${cp2Pos}%`}]}>🎨</Text>
            <Text style={[styles.label, {left: `${cp3Pos}%`}]}>🖼️</Text>
       </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
  },
   scoreText: {
     fontSize: 12,
     color: '#555',
     marginBottom: 4,
   },
  barContainer: {
    height: 8,
    width: '90%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    position: 'relative', // Needed for absolute positioning of markers
    overflow: 'hidden', // Ensure progress bar stays within bounds
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'deepskyblue',
    borderRadius: 4,
  },
  checkpointMarker: {
      position: 'absolute',
      top: -1, // Adjust for alignment
      transform: [{ translateX: -5 }], // Center the marker
  },
   checkpointLabels: {
       width: '90%',
       flexDirection: 'row',
       marginTop: 2,
       position: 'relative', // To position labels relative to this container
   },
    label: {
        position: 'absolute',
        fontSize: 10,
         transform: [{ translateX: -5 }], // Center the label
    }
});

export default ProgressBar;