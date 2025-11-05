import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Bookmark, FolderPlus, Folder, Trash2, Edit, Plus } from "lucide-react";
import { SkeletonPost } from "@/components/ui/enhanced-skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";

interface SavedPost {
  id: string;
  post_id: string;
  collection_id: string | null;
  created_at: string;
  post: {
    id: string;
    content: string | null;
    media_url: string | null;
    media_type: string | null;
    created_at: string;
    profile: {
      username: string;
      full_name: string | null;
      profile_photo: string | null;
    };
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const SavedPosts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await loadCollections(user.id);
    await loadSavedPosts(user.id);
  };

  const loadCollections = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error: any) {
      console.error("Error loading collections:", error);
    }
  };

  const loadSavedPosts = async (currentUserId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("saved_posts")
        .select(`
          *,
          posts!inner (
            id,
            content,
            media_url,
            media_type,
            created_at,
            profiles!posts_user_id_fkey (
              username,
              full_name,
              profile_photo
            )
          )
        `)
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        post: {
          ...item.posts,
          profile: item.posts.profiles
        }
      }));

      setSavedPosts(formattedData);
    } catch (error: any) {
      console.error("Error loading saved posts:", error);
      toast({
        title: "Hata",
        description: "Kaydedilenler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Hata",
        description: "Koleksiyon adı gerekli",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("collections")
        .insert({
          user_id: userId,
          name: newCollectionName,
          description: newCollectionDesc || null,
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Koleksiyon oluşturuldu",
      });

      setNewCollectionName("");
      setNewCollectionDesc("");
      setCreateDialogOpen(false);
      await loadCollections(userId);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Koleksiyon oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleMoveToCollection = async (savedPostId: string, collectionId: string | null) => {
    try {
      const { error } = await supabase
        .from("saved_posts")
        .update({ collection_id: collectionId })
        .eq("id", savedPostId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: collectionId ? "Koleksiyona taşındı" : "Koleksiyondan çıkarıldı",
      });

      await loadSavedPosts(userId);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Koleksiyon silindi",
      });

      await loadCollections(userId);
      await loadSavedPosts(userId);
      setSelectedCollection(null);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Koleksiyon silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleUnsave = async (savedPostId: string) => {
    try {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", savedPostId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Gönderi kaydedilenlerden kaldırıldı",
      });

      await loadSavedPosts(userId);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi",
        variant: "destructive",
      });
    }
  };

  const filteredPosts = selectedCollection
    ? savedPosts.filter(sp => sp.collection_id === selectedCollection)
    : savedPosts.filter(sp => !sp.collection_id);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Breadcrumb />
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Kaydedilenler
          </h1>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Koleksiyon Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Koleksiyon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Koleksiyon adı"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
                <Textarea
                  placeholder="Açıklama (isteğe bağlı)"
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                />
                <Button onClick={handleCreateCollection} className="w-full">
                  Oluştur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all" onClick={() => setSelectedCollection(null)}>
              <Bookmark className="w-4 h-4 mr-2" />
              Tümü ({savedPosts.filter(sp => !sp.collection_id).length})
            </TabsTrigger>
            {collections.map(collection => (
              <TabsTrigger
                key={collection.id}
                value={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
              >
                <Folder className="w-4 h-4 mr-2" />
                {collection.name} ({savedPosts.filter(sp => sp.collection_id === collection.id).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCollection || "all"}>
            {selectedCollection && (
              <div className="flex items-center justify-between mb-4 p-4 bg-card rounded-lg">
                <div>
                  <h3 className="font-semibold">{collections.find(c => c.id === selectedCollection)?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {collections.find(c => c.id === selectedCollection)?.description}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCollection(selectedCollection)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                <SkeletonPost />
                <SkeletonPost />
                <SkeletonPost />
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Henüz kayıtlı gönderi yok</p>
                  <p className="text-sm text-muted-foreground">
                    Feed'den gönderileri kaydederek buradan erişebilirsiniz
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPosts.map((saved) => (
                  <Card key={saved.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={saved.post.profile.profile_photo || ""} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {saved.post.profile.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                {saved.post.profile.full_name || saved.post.profile.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{saved.post.profile.username} •{" "}
                                {formatDistanceToNow(new Date(saved.post.created_at), {
                                  addSuffix: true,
                                  locale: tr,
                                })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Select
                                value={saved.collection_id || "none"}
                                onValueChange={(value) =>
                                  handleMoveToCollection(saved.id, value === "none" ? null : value)
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Koleksiyon seç" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Koleksiyonsuz</SelectItem>
                                  {collections.map((collection) => (
                                    <SelectItem key={collection.id} value={collection.id}>
                                      {collection.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUnsave(saved.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {saved.post.content && (
                        <p className="text-sm mb-4 whitespace-pre-wrap">{saved.post.content}</p>
                      )}

                      {saved.post.media_url && (
                        <div className="rounded-lg overflow-hidden">
                          {saved.post.media_type === "image" ? (
                            <img
                              src={saved.post.media_url}
                              alt="Post media"
                              className="w-full max-h-96 object-cover"
                            />
                          ) : saved.post.media_type === "video" ? (
                            <video
                              src={saved.post.media_url}
                              controls
                              className="w-full max-h-96"
                            />
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SavedPosts;
