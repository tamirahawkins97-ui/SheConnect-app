//Create a interface of backend model Schemas:
//Define the user roles for mommies as a union type 

export type UserRole = 'user' | 'Veteran Mommy';
export type ConversationType = 'direct' | 'group';

//The user model returned by the API:
export interface User {
    _id: string;
    username: string;
    email:string;
    avatar?: string;
    role: UserRole;
    createdAt?:string;
    updatedAt?: string;
      
}

//Payload for Registration 
export interface RegisterUserInput {
    username:string;
    email:string;
    password:string,
    role?:UserRole
}

//Payload for login 
export interface LoginUserInput {
    email:string;
    password:string;
}

//Auth response payload
export interface AuthResponse {
    token: string;
    user:User;
}

export interface Post {
    _id:string;
    imageURL?:string;
    message:string;
    Day:number;
    Week: number;
    Trimester:string;
    createdAt: string;
    updatedAt: string;
}

//Minimal Message interface for lastMessage
export interface Message {
  _id: string;
  sender: User | string;
  text: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// The Core Conversation Interface
export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: (User | string)[]; // User[] when populated, string[] if raw IDs
  maxParticipants: number;
  groupTitle?: string;              // Optional: only present if type === 'group'
  lastMessage: Message | string | null; // null if brand new, string ID or populated Message
  createdAt: string;
  updatedAt: string;
}

// 4. Form Payloads for Creating Conversations
export interface CreateDirectConversationInput {
  type: 'direct';
  recipientId: string;
}

export interface CreateGroupConversationInput {
  type: 'group';
  groupTitle: string;
  participantIds: string[];
  maxParticipants?: number;
}