
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCheck, Upload, Video, User } from "lucide-react";
import { useState } from "react";
import { UserCard } from "./users/UserCard";
import { UserDetails } from "./users/UserDetails";
import { RoleFilter } from "./users/RoleFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  role?: string;
  bio?: string;
  phone?: string;
}

export const UsersList = () => {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [onlineUsers] = useState<Set<string>>(new Set(["1", "3"])); 

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error fetching users');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const users = response?.data || [];

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case "uploader":
        return <Upload className="h-4 w-4 text-green-500" />;
      case "youtuber":
        return <Video className="h-4 w-4 text-red-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredUsers = users?.filter(user =>
    selectedRole === "all" ? true : user.role === selectedRole
  );

  const roles = Array.from(new Set(users?.map(user => user.role) || [])).filter(Boolean);

  if (isLoading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded-lg animate-pulse"/>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/10 text-destructive">
            Error al cargar los usuarios. Por favor, intenta de nuevo.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">Equipo</h2>
            <Badge variant="secondary">{users.length} usuarios</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o email..."
              className="w-full h-10 pl-4 pr-10 rounded-md border border-input bg-background"
            />
            <kbd className="absolute right-2 top-2.5 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>J
            </kbd>
          </div>
          <RoleFilter
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
          />
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers?.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onSelect={setSelectedUser}
                  isOnline={onlineUsers.has(user.id)}
                />
              ))}
            </div>
          </ScrollArea>
          <UserDetails
            user={selectedUser}
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            isOnline={selectedUser ? onlineUsers.has(selectedUser.id) : false}
          />
        </div>
      </CardContent>
    </Card>
  );
};
