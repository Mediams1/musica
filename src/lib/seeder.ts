import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Song, LATIN_GENRES } from '../types';

export async function seedLibrary() {
  const batch = writeBatch(db);
  
  for (const genre of LATIN_GENRES) {
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(genre)}&limit=3&entity=song&country=mx`);
      const data = await response.json();
      
      data.results.forEach((result: any) => {
        const songId = `apple-${result.trackId}`;
        const song: Omit<Song, 'id'> = {
          title: result.trackName,
          author: result.artistName,
          genre: genre,
          releaseDate: result.releaseDate,
          duration: Math.floor(result.trackTimeMillis / 1000),
          previewUrl: result.previewUrl,
          artworkUrl: result.artworkUrl100.replace('100x100', '600x600'),
          appleMusicId: result.trackId.toString()
        };
        
        const songRef = doc(db, 'songs', songId);
        batch.set(songRef, song);
      });
    } catch (error) {
      console.error(`Error seeding genre ${genre}:`, error);
    }
  }
  
  await batch.commit();
}
