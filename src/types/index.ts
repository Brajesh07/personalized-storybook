export interface StoryData {
  title: string;
  content: string;
  pages: number;
  illustrations: string[];
}

export interface FormData {
  childName: string;
  childAge: number;
  photos: File[];
}

export interface GeneratedStory {
  title: string;
  pages: StoryPage[];
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  illustration?: string;
}
