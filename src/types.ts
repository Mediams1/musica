export interface Song {
  id: string;
  title: string;
  author: string;
  genre: string;
  releaseDate: string;
  duration: number;
  previewUrl: string;
  artworkUrl: string;
  appleMusicId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferredGenres: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  songIds: string[];
  artworkUrl?: string;
}

export interface PlaybackHistory {
  userId: string;
  songId: string;
  genre: string;
  timestamp: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export const LATIN_GENRES = [
  "Reggaeton",
  "Salsa",
  "Bachata",
  "Merengue",
  "Latin Trap",
  "Regional Mexicano",
  "Latin Pop",
  "Cumbia",
  "Vallenato",
  "Bossa Nova"
];
