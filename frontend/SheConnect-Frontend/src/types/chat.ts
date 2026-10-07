export interface User {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface Message {
  _id: string;
  sender: string | User;
  text: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: string;
  updatedAt: string;
}