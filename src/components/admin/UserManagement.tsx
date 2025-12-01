import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Ban,
  UserX,
  Shield,
  ShieldCheck,
  Clock,
  History,
  Search,
  Loader2,
} from "lucide-react";

interface Profile {
  user_id: string;
  username: string;
  credits: number;
  created_at: string;
  is_banned: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  ban_reason: string | null;
  suspension_reason: string | null;
  moderation_notes: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface ModerationLog {
  id: string;
  user_id: string;
  moderator_id: string;
  action: string;
  reason: string;
  details: any;
  created_at: string;
}

export const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Moderation dialog state
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<"ban" | "suspend" | "role">("ban");
  const [moderationReason, setModerationReason] = useState("");
  const [suspendUntil, setSuspendUntil] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("user");

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadProfiles(), loadUserRoles()]);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veri yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProfiles(data || []);
  };

  const loadUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (error) throw error;
    setUserRoles(data || []);
  };

  const loadModerationLogs = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_moderation_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading moderation logs:", error);
      return;
    }
    setModerationLogs(data || []);
  };

  const getUserRole = (userId: string): string => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || "user";
  };

  const handleSelectUser = (profile: Profile) => {
    setSelectedUser(profile);
    loadModerationLogs(profile.user_id);
  };

  const openModerationDialog = (action: "ban" | "suspend" | "role") => {
    if (!selectedUser) return;
    setModerationAction(action);
    setModerationReason("");
    setSuspendUntil("");
    setSelectedRole(getUserRole(selectedUser.user_id) as any);
    setIsModerationDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!selectedUser || !moderationReason) {
      toast({
        title: "Hata",
        description: "Lütfen ban sebebini belirtin",
        variant: "destructive",
      });
      return;
    }

    setIsActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_banned: true,
          ban_reason: moderationReason,
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      // Log action
      const { error: logError } = await supabase
        .from("user_moderation_logs")
        .insert({
          user_id: selectedUser.user_id,
          moderator_id: user.id,
          action: "ban",
          reason: moderationReason,
        });

      if (logError) console.error("Log error:", logError);

      toast({
        title: "Başarılı",
        description: `${selectedUser.username} kullanıcısı banlandı`,
      });

      setIsModerationDialogOpen(false);
      await loadData();
      if (selectedUser) {
        await loadModerationLogs(selectedUser.user_id);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı banlanamadı",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    setIsActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          ban_reason: null,
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      // Log action
      await supabase.from("user_moderation_logs").insert({
        user_id: selectedUser.user_id,
        moderator_id: user.id,
        action: "unban",
        reason: "Ban kaldırıldı",
      });

      toast({
        title: "Başarılı",
        description: `${selectedUser.username} kullanıcısının banı kaldırıldı`,
      });

      await loadData();
      if (selectedUser) {
        await loadModerationLogs(selectedUser.user_id);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ban kaldırılamadı",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !moderationReason || !suspendUntil) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_suspended: true,
          suspended_until: suspendUntil,
          suspension_reason: moderationReason,
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      // Log action
      await supabase.from("user_moderation_logs").insert({
        user_id: selectedUser.user_id,
        moderator_id: user.id,
        action: "suspend",
        reason: moderationReason,
        details: { suspended_until: suspendUntil },
      });

      toast({
        title: "Başarılı",
        description: `${selectedUser.username} kullanıcısı askıya alındı`,
      });

      setIsModerationDialogOpen(false);
      await loadData();
      if (selectedUser) {
        await loadModerationLogs(selectedUser.user_id);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı askıya alınamadı",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnsuspendUser = async () => {
    if (!selectedUser) return;

    setIsActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_suspended: false,
          suspended_until: null,
          suspension_reason: null,
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      // Log action
      await supabase.from("user_moderation_logs").insert({
        user_id: selectedUser.user_id,
        moderator_id: user.id,
        action: "unsuspend",
        reason: "Askı kaldırıldı",
      });

      toast({
        title: "Başarılı",
        description: `${selectedUser.username} kullanıcısının askısı kaldırıldı`,
      });

      await loadData();
      if (selectedUser) {
        await loadModerationLogs(selectedUser.user_id);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Askı kaldırılamadı",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    setIsActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      const currentRole = getUserRole(selectedUser.user_id);

      // Remove existing role
      if (currentRole !== "user") {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.user_id);
      }

      // Add new role (only if not user, as user is the default)
      if (selectedRole !== "user") {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedUser.user_id,
            role: selectedRole,
          });

        if (insertError) throw insertError;
      }

      // Log action
      await supabase.from("user_moderation_logs").insert({
        user_id: selectedUser.user_id,
        moderator_id: user.id,
        action: "role_change",
        reason: `Rol değiştirildi: ${currentRole} → ${selectedRole}`,
        details: { from_role: currentRole, to_role: selectedRole },
      });

      toast({
        title: "Başarılı",
        description: `${selectedUser.username} kullanıcısının rolü değiştirildi`,
      });

      setIsModerationDialogOpen(false);
      await loadUserRoles();
      if (selectedUser) {
        await loadModerationLogs(selectedUser.user_id);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Rol değiştirilemedi",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const executeModerationAction = () => {
    if (moderationAction === "ban") return handleBanUser();
    if (moderationAction === "suspend") return handleSuspendUser();
    if (moderationAction === "role") return handleChangeRole();
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      ban: "Banlandı",
      unban: "Ban Kaldırıldı",
      suspend: "Askıya Alındı",
      unsuspend: "Askı Kaldırıldı",
      role_change: "Rol Değiştirildi",
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Users List */}
      <Card className="p-6 lg:col-span-1">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Kullanıcı Yönetimi</h2>
          <Badge variant="secondary" className="ml-auto">{profiles.length}</Badge>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredProfiles.map((profile) => {
            const role = getUserRole(profile.user_id);
            return (
              <div
                key={profile.user_id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedUser?.user_id === profile.user_id
                    ? "bg-primary/10 border-primary"
                    : "bg-card hover:bg-accent"
                }`}
                onClick={() => handleSelectUser(profile)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{profile.username}</p>
                      {role !== "user" && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {profile.is_banned && (
                        <Badge variant="destructive" className="text-xs">
                          <Ban className="w-3 h-3 mr-1" />
                          Banlı
                        </Badge>
                      )}
                      {profile.is_suspended && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Askıda
                        </Badge>
                      )}
                      <Badge variant="outline">{profile.credits} kredi</Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* User Details & Actions */}
      <div className="lg:col-span-2 space-y-6">
        {selectedUser ? (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Kullanıcı Detayları</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Kullanıcı Adı</p>
                    <p className="font-semibold">{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rol</p>
                    <Badge variant="outline">{getUserRole(selectedUser.user_id)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kredi</p>
                    <p className="font-semibold">{selectedUser.credits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kayıt Tarihi</p>
                    <p className="font-semibold">
                      {new Date(selectedUser.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>

                {selectedUser.is_banned && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="font-semibold text-destructive mb-1">Ban Sebebi:</p>
                    <p className="text-sm">{selectedUser.ban_reason}</p>
                  </div>
                )}

                {selectedUser.is_suspended && selectedUser.suspended_until && (
                  <div className="p-4 bg-secondary border rounded-lg">
                    <p className="font-semibold mb-1">Askı Sebebi:</p>
                    <p className="text-sm mb-2">{selectedUser.suspension_reason}</p>
                    <p className="text-sm text-muted-foreground">
                      Askı Bitiş: {new Date(selectedUser.suspended_until).toLocaleString("tr-TR")}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {selectedUser.is_banned ? (
                  <Button
                    onClick={handleUnbanUser}
                    disabled={isActionLoading}
                    variant="outline"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserX className="w-4 h-4 mr-2" />
                    )}
                    Ban Kaldır
                  </Button>
                ) : (
                  <Button
                    onClick={() => openModerationDialog("ban")}
                    variant="destructive"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Banla
                  </Button>
                )}

                {selectedUser.is_suspended ? (
                  <Button
                    onClick={handleUnsuspendUser}
                    disabled={isActionLoading}
                    variant="outline"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 mr-2" />
                    )}
                    Askıyı Kaldır
                  </Button>
                ) : (
                  <Button
                    onClick={() => openModerationDialog("suspend")}
                    variant="secondary"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Askıya Al
                  </Button>
                )}

                <Button
                  onClick={() => openModerationDialog("role")}
                  variant="outline"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Rol Değiştir
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Moderasyon Geçmişi</h2>
                <Badge variant="secondary" className="ml-auto">{moderationLogs.length}</Badge>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {moderationLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Moderasyon geçmişi bulunamadı
                  </p>
                ) : (
                  moderationLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString("tr-TR")}
                            </span>
                          </div>
                          <p className="text-sm">{log.reason}</p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Kullanıcı Seçin</h3>
            <p className="text-muted-foreground">
              Detayları görüntülemek için sol taraftan bir kullanıcı seçin
            </p>
          </Card>
        )}
      </div>

      {/* Moderation Action Dialog */}
      <Dialog open={isModerationDialogOpen} onOpenChange={setIsModerationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === "ban" && "Kullanıcıyı Banla"}
              {moderationAction === "suspend" && "Kullanıcıyı Askıya Al"}
              {moderationAction === "role" && "Kullanıcı Rolünü Değiştir"}
            </DialogTitle>
            <DialogDescription>
              {moderationAction === "ban" &&
                "Kullanıcıyı kalıcı olarak banlamak üzeresiniz. Bu işlem geri alınabilir."}
              {moderationAction === "suspend" &&
                "Kullanıcıyı belirli bir süre için askıya almak üzeresiniz."}
              {moderationAction === "role" && "Kullanıcının yetki seviyesini değiştirin."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {moderationAction === "role" ? (
              <div>
                <Label>Yeni Rol</Label>
                <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Kullanıcı</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                {moderationAction === "suspend" && (
                  <div>
                    <Label htmlFor="suspendUntil">Askı Bitiş Tarihi</Label>
                    <Input
                      id="suspendUntil"
                      type="datetime-local"
                      value={suspendUntil}
                      onChange={(e) => setSuspendUntil(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="reason">Sebep</Label>
                  <Textarea
                    id="reason"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Moderasyon sebebini açıklayın..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModerationDialogOpen(false)}
              disabled={isActionLoading}
            >
              İptal
            </Button>
            <Button
              onClick={executeModerationAction}
              disabled={isActionLoading}
              variant={moderationAction === "ban" ? "destructive" : "default"}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                "Onayla"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};