// src/data/stories.ts

// 1. Import the JSON. 
//    This gives us the entire object (with the "stories" key).
import rawStories from './stories.json';

// 2. Create a TypeScript type based on the structure of `rawStories.stories`.
//    `typeof rawStories.stories` tells TypeScript “use the exact shape of this value.”
export type StoryData = typeof rawStories.stories;

// 3. Export only the `stories` property as `storiesByAge`, typed as StoryData.
//    This makes it easy to import `storiesByAge` everywhere else.
export const storiesByAge: StoryData = rawStories.stories;
