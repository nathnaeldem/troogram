export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          follower_count: number;
          following_count: number;
          post_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          follower_count?: number;
          following_count?: number;
          post_count?: number;
          created_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          follower_count?: number;
          following_count?: number;
          post_count?: number;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          caption: string | null;
          like_count: number;
          comment_count: number;
          location: string | null;
          is_verified_capture: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          caption?: string | null;
          like_count?: number;
          comment_count?: number;
          location?: string | null;
          is_verified_capture?: boolean;
          created_at?: string;
        };
        Update: {
          caption?: string | null;
          like_count?: number;
          comment_count?: number;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: never;
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: never;
      };
      conversations: {
        Row: {
          id: string;
          participant_one: string;
          participant_two: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_one: string;
          participant_two: string;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          last_message_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
  };
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'follow';
  post_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationWithActor = Notification & {
  actor: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_verified'>;
  post?: Pick<Post, 'id' | 'media_url' | 'media_type'> | null;
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

export type PostWithProfile = Post & {
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_verified'>;
  liked_by_me?: boolean;
};

export type ConversationWithProfile = Conversation & {
  other_user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_verified'>;
  last_message?: string;
  unread_count?: number;
};
