import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { User, Profile } from '../../types'; // Import types
import { updateMyProfile, uploadProfileMedia } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

type Props = NativeStackScreenProps<MainStackParamList, 'ProfileEdit'>;

const ProfileEditScreen: React.FC<Props> = ({ route, navigation }) => {
  const initialData = route.params.profileData;
  const [profile, setProfile] = useState<Partial<Profile>>(initialData.profile || {});
  const [userFields, setUserFields] = useState<Partial<User>>({
        gender: initialData.gender,
        preferredGenders: initialData.preferredGenders,
        age: initialData.age,
        // Keep URLs for display, don't send them back directly unless changed
        interestPhotoUrl: initialData.interestPhotoUrl,
        mainPhotoUrl: initialData.mainPhotoUrl,
        voiceIntroUrl: initialData.voiceIntroUrl,
  });
  const [isLoading, setIsLoading] = useState(false);
  // State to hold selected image URIs (local URIs)
  const [interestPhotoUri, setInterestPhotoUri] = useState<string | null>(null);
  const [mainPhotoUri, setMainPhotoUri] = useState<string | null>(null);


  const handleInputChange = (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

   const handleUserInputChange = (field: keyof User, value: any) => {
    setUserFields(prev => ({ ...prev, [field]: value }));
  };

  // --- Image Picking Logic ---
  const pickImage = async (setImageUriCallback: (uri: string | null) => void) => {
    // Request permissions if needed
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "You need to allow access to photos to upload.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.7, // Compress image
    });

    if (!result.canceled) {
        setImageUriCallback(result.assets[0].uri);
        // Update the display URL immediately for better UX
         if(setImageUriCallback === setInterestPhotoUri) setUserFields(prev => ({...prev, interestPhotoUrl: result.assets[0].uri}));
         if(setImageUriCallback === setMainPhotoUri) setUserFields(prev => ({...prev, mainPhotoUrl: result.assets[0].uri}));
    }
  };


   // --- Save Logic ---
   const handleSave = async () => {
        setIsLoading(true);
        try {
            // 1. Upload new images if selected
            let interestPhotoServerUrl = userFields.interestPhotoUrl; // Keep existing if no new one picked
            let mainPhotoServerUrl = userFields.mainPhotoUrl;

            if (interestPhotoUri) {
                const formData = new FormData();
                // Need to figure out filename and type from URI
                 const filename = interestPhotoUri.split('/').pop() || 'interest_photo.jpg';
                 const match = /\.(\w+)$/.exec(filename);
                 const type = match ? `image/${match[1]}` : `image`;

                 formData.append('interestPhoto', { uri: interestPhotoUri, name: filename, type } as any);
                 const uploadRes = await uploadProfileMedia('upload/interest-photo', formData);
                 interestPhotoServerUrl = uploadRes.data.url; // Assuming backend returns URL
                 console.log("Interest Photo Upload Res:", uploadRes.data);
             }

            if (mainPhotoUri) {
                 const formData = new FormData();
                 const filename = mainPhotoUri.split('/').pop() || 'main_photo.jpg';
                 const match = /\.(\w+)$/.exec(filename);
                 const type = match ? `image/${match[1]}` : `image`;

                 formData.append('mainPhoto', { uri: mainPhotoUri, name: filename, type } as any);
                 const uploadRes = await uploadProfileMedia('upload/main-photo', formData);
                 mainPhotoServerUrl = uploadRes.data.url;
                 console.log("Main Photo Upload Res:", uploadRes.data);
             }

            // TODO: Handle voice intro upload similarly

            // 2. Update profile text fields and potentially updated URLs
            const updatePayload = {
                ...profile, // openingQuestion, commsStyle, amaPrompts
                ...userFields, // gender, preferredGenders, age
                interestPhotoUrl: interestPhotoServerUrl, // Send final URLs
                mainPhotoUrl: mainPhotoServerUrl,
                // voiceIntroUrl: ...
            };
             // Remove local display URLs before sending
             // delete updatePayload.interestPhotoUrl; // Assuming backend expects actual server URLs
             // delete updatePayload.mainPhotoUrl;


            await updateMyProfile(updatePayload);

            Alert.alert("Success", "Profile updated!");
            navigation.goBack();

        } catch (error: any) {
             console.error("Failed to update profile:", error.response?.data || error);
             Alert.alert("Error", "Could not update profile.");
        } finally {
             setIsLoading(false);
        }
    };


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Opening Question</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={profile.openingQuestion || ''}
        onChangeText={(value) => handleInputChange('openingQuestion', value)}
        placeholder="Ask something interesting..."
        multiline
      />

       <Text style={styles.label}>Age</Text>
        <TextInput
            style={styles.input}
            value={userFields.age?.toString() || ''}
            onChangeText={(value) => handleUserInputChange('age', parseInt(value) || null)}
            placeholder="Your age"
            keyboardType="number-pad"
        />

      {/* Add inputs for communicationStyle, AMA prompts, Gender, Preferred Genders etc. */}
      {/* Use Pickers or custom components for selecting enums like Gender */}

      <Text style={styles.label}>Interest Photo</Text>
      <Button title="Choose Interest Photo" onPress={() => pickImage(setInterestPhotoUri)} />
       {/* Show existing or newly selected photo */}
      {(userFields.interestPhotoUrl || interestPhotoUri) && <Image source={{ uri: interestPhotoUri || userFields.interestPhotoUrl }} style={styles.imagePreview} /> }


      <Text style={styles.label}>Main Photo</Text>
       <Button title="Choose Main Photo" onPress={() => pickImage(setMainPhotoUri)} />
      {(userFields.mainPhotoUrl || mainPhotoUri) && <Image source={{ uri: mainPhotoUri || userFields.mainPhotoUrl }} style={styles.imagePreview} /> }


       {/* Add section for Voice Intro upload/playback */}


      <View style={styles.spacer} />
      <Button title={isLoading ? "Saving..." : "Save Profile"} onPress={handleSave} disabled={isLoading} />
       <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  label: { fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  textArea: {
      height: 100,
      textAlignVertical: 'top', // Align text to top for multiline
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginTop: 10,
    alignSelf: 'center',
    borderRadius: 5,
  },
  spacer: { height: 30 },
});

export default ProfileEditScreen;