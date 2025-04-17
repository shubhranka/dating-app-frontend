// Define types matching your Prisma Schema - This is a basic example
// Consider using tools to generate types from your backend schema if possible

export enum Gender {
    MAN = "MAN",
    WOMAN = "WOMAN",
    NON_BINARY = "NON_BINARY",
    OTHER = "OTHER",
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"
  }
  
  export interface Profile {
    id: string;
    userId: string;
    openingQuestion?: string;
    communicationStyle?: string; // Use specific enum if available
    amaPrompt1?: string;
    amaPrompt2?: string;
    amaPrompt3?: string;
    updatedAt: string;
  }
  
  export interface User {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    gender?: Gender;
    preferredGenders?: Gender[];
    age?: number;
    voiceIntroUrl?: string;
    interestPhotoUrl?: string;
    mainPhotoUrl?: string;
    isVerified: boolean;
    premiumTier?: string;
    profile?: Profile;
    // Add other relations like interests, values if needed on frontend often
  }
  
  export interface Message {
      id: string;
      matchId: string;
      senderId: string;
      content?: string;
      type: 'TEXT' | 'VOICE' | 'SYSTEM';
      voiceUrl?: string;
      createdAt: string;
      // Maybe add sender details if needed for display
      // sender?: Pick<User, 'id' /* add name/pic later */>;
  }
  
  export interface ChatProgress {
      id: string;
      matchId: string;
      score: number;
      checkpoint1Reached: boolean;
      checkpoint2Reached: boolean;
      checkpoint3Reached: boolean;
      user1VibeChoice: 'PENDING' | 'YES' | 'NO';
      user2VibeChoice: 'PENDING' | 'YES' | 'NO';
      updatedAt: string;
  }
  
  
  export interface Match {
      id: string;
      user1Id: string;
      user2Id: string;
      status: 'PENDING' | 'ACTIVE' | 'CLOSED_MISMATCH' | 'CLOSED_SUCCESS' | 'BLOCKED';
      createdAt: string;
      updatedAt: string;
      progress?: ChatProgress;
      // Include limited info about the other user for list display
      user1?: Partial<User>;
      user2?: Partial<User>;
      // Potentially last message for preview
      // lastMessage?: Message;
  }