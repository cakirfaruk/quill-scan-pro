import { useEffect, useState, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { StoryViewer } from "./StoryViewer";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "photo" | "video";
  created_at: string;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  views_count: number;
  has_viewed: boolean;
}

interface UserStories {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
  stories: Story[];
  has_unviewed: boolean;
}

interface StoriesBarProps {
  currentUserId: string;
}

export const StoriesBar = memo(({ currentUserId }: StoriesBarProps) => {
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [ownStories, setOwnStories] = useState<Story[]>([]);
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStories = useCallback(async () => {
    try {
      // **STEP 1: PARALEL** - Own stories, profile, friends
      const [ownStoriesResult, ownProfileResult, friendsResult] = await Promise.all([
        supabase
          .from("stories")
          .select("*")
          .eq("user_id", currentUserId)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false }),
        
        supabase
          .from("profiles")
          .select("username, full_name, profile_photo")
          .eq("user_id", currentUserId)
          .single(),
        
        supabase
          .from("friends")
          .select(`
            user_id,
            friend_id,
            user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo),
            friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
          `)
          .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
          .eq("status", "accepted")
      ]);

      // Process own stories
      if (ownStoriesResult.data && ownStoriesResult.data.length > 0) {
        const ownStoryIds = ownStoriesResult.data.map(s => s.id);
        
        // Get view counts for own stories
        const { data: ownViewsData } = await supabase
          .from("story_views")
          .select("story_id")
          .in("story_id", ownStoryIds);

        const viewCountsMap = new Map<string, number>();
        (ownViewsData || []).forEach((view: any) => {
          viewCountsMap.set(view.story_id, (viewCountsMap.get(view.story_id) || 0) + 1);
        });

        const storiesWithViews = ownStoriesResult.data.map((story: any) => ({
          id: story.id,
          user_id: story.user_id,
          media_url: story.media_url,
          media_type: story.media_type as "photo" | "video",
          created_at: story.created_at,
          profile: ownProfileResult.data || { username: "", full_name: null, profile_photo: null },
          views_count: viewCountsMap.get(story.id) || 0,
          has_viewed: false,
        }));
        
        setOwnStories(storiesWithViews);
      }

      // Process friends' stories
      if (!friendsResult.data || friendsResult.data.length === 0) {
        setLoading(false);
        return;
      }

      const friendIds = friendsResult.data.map((f: any) => {
        const isSender = f.user_id === currentUserId;
        return isSender ? f.friend_id : f.user_id;
      });

      if (friendIds.length === 0) {
        setLoading(false);
        return;
      }

      // **STEP 2: PARALEL** - Friends stories, profiles, view data
      const [friendsStoriesResult, profilesResult, viewsResult, allViewsResult] = await Promise.all([
        supabase
          .from("stories")
          .select("*")
          .in("user_id", friendIds)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false }),
        
        supabase
          .from("profiles")
          .select("user_id, username, full_name, profile_photo")
          .in("user_id", friendIds),
        
        supabase
          .from("story_views")
          .select("story_id")
          .eq("viewer_id", currentUserId),
        
        supabase
          .from("story_views")
          .select("story_id")
      ]);

      if (friendsStoriesResult.data && friendsStoriesResult.data.length > 0) {
        // Create maps for quick lookups
        const profilesMap = new Map(profilesResult.data?.map((p: any) => [p.user_id, p]) || []);
        const viewedStoriesSet = new Set(viewsResult.data?.map((v: any) => v.story_id) || []);
        const viewCountsMap = new Map<string, number>();
        allViewsResult.data?.forEach((view: any) => {
          viewCountsMap.set(view.story_id, (viewCountsMap.get(view.story_id) || 0) + 1);
        });

        // Group stories by user
        const groupedStories: { [key: string]: UserStories } = {};

        for (const story of friendsStoriesResult.data) {
          const profile = profilesMap.get(story.user_id);
          if (!profile) continue;

          const storyWithData: Story = {
            id: story.id,
            user_id: story.user_id,
            media_url: story.media_url,
            media_type: story.media_type as "photo" | "video",
            created_at: story.created_at,
            profile,
            views_count: viewCountsMap.get(story.id) || 0,
            has_viewed: viewedStoriesSet.has(story.id),
          };

          if (!groupedStories[story.user_id]) {
            groupedStories[story.user_id] = {
              user_id: story.user_id,
              username: profile.username,
              full_name: profile.full_name,
              profile_photo: profile.profile_photo,
              stories: [],
              has_unviewed: false,
            };
          }

          groupedStories[story.user_id].stories.push(storyWithData);
          if (!storyWithData.has_viewed) {
            groupedStories[story.user_id].has_unviewed = true;
          }
        }

        setUserStories(Object.values(groupedStories));
      }
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadStories();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("stories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
        },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStories]);

  const handleStoryClick = useCallback((stories: Story[], index: number = 0) => {
    setSelectedStories(stories);
    setSelectedIndex(index);
    setViewerOpen(true);
  }, []);

  if (loading) return null;

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-3 p-4 pb-2">
          {/* Own story / Create story */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() =>
                ownStories.length > 0
                  ? handleStoryClick(ownStories)
                  : setCreateDialogOpen(true)
              }
              className="relative"
            >
              <Avatar className="w-16 h-16 ring-2 ring-primary">
                <AvatarImage src={ownStories[0]?.profile.profile_photo || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  Sen
                </AvatarFallback>
              </Avatar>
              {ownStories.length === 0 && (
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                  <Plus className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
            <p className="text-xs font-medium text-center max-w-[64px] truncate">
              {ownStories.length > 0 ? "Hikayen" : "Oluştur"}
            </p>
          </div>

          {/* Friends' stories */}
          {userStories.map((user) => (
            <div
              key={user.user_id}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer animate-fade-in"
              onClick={() => handleStoryClick(user.stories)}
            >
              <Avatar
                className={`w-16 h-16 ring-2 ${
                  user.has_unviewed
                    ? "ring-gradient-primary"
                    : "ring-muted"
                }`}
              >
                <AvatarImage src={user.profile_photo || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs font-medium text-center max-w-[64px] truncate">
                {user.full_name || user.username}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <StoryViewer
        stories={selectedStories}
        initialIndex={selectedIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        currentUserId={currentUserId}
      />

      <CreateStoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadStories}
      />
    </>
  );
});
