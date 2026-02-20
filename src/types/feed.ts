export interface Profile {
    user_id: string;
    username: string;
    full_name: string | null;
    profile_photo: string | null;
}

export interface Post {
    id: string;
    user_id: string;
    content: string | null;
    media_url: string | null;
    media_type: string | null;
    created_at: string;
    shares_count: number;
    profile: Profile;
    likes: number;
    comments: number;
    hasLiked: boolean;
    hasSaved: boolean;
}

export interface Comment {
    id: string;
    content: string;
    created_at: string;
    parent_comment_id: string | null;
    user_id: string;
    user: {
        username: string;
        full_name: string | null;
        profile_photo: string | null;
    };
    likes: number;
    hasLiked: boolean;
    replies: Comment[];
}

export interface Friend {
    user_id: string;
    username: string;
    full_name: string | null;
    profile_photo: string | null;
}

export interface Collection {
    id: string;
    name: string;
    description: string | null;
}
