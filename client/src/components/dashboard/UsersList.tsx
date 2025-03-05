
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  UserCheck, Upload, Video, User, Users, 
  Search, Loader2, ShieldCheck, Pencil, Shield,
  SquareUser, Wifi, WifiOff
} from "lucide-react";
import { useState, useEffect } from "react";
import { UserCard } from "./users/UserCard";
import { UserDetails } from "./users/UserDetails";
import { RoleFilter } from "./users/RoleFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/useUsers";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { users, isLoading } = useUsers();
  const { onlineUsers: onlineUsersData, isConnected, usingFallback } = useOnlineUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Crear un conjunto de IDs de usuarios en línea para búsqueda rápida
  const onlineUserIds = new Set(onlineUsersData.map(user => user.userId.toString()));

  // Filtrar usuarios por rol y búsqueda
  const filteredUsers = users?.filter(user =>
    (selectedRole === "all" ? true : user.role === selectedRole) &&
    (searchQuery === "" ? true : 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  ) || [];

  // Obtener todos los roles existentes
  const roles = Array.from(new Set(users?.map(user => user.role) || [])).filter(Boolean);
  
  // Obtener estadísticas de roles
  const roleStats = users?.reduce((acc: Record<string, number>, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {}) || {};

  // Obtener el ícono apropiado según el rol
  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case "reviewer":
      case "content_reviewer":
      case "media_reviewer":
        return <Pencil className="h-4 w-4 text-purple-500" />;
      case "optimizer":
        return <Upload className="h-4 w-4 text-blue-500" />;
      case "youtuber":
        return <Video className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Obtener color de badge según el rol
  const getRoleBadgeClasses = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "reviewer":
      case "content_reviewer":
      case "media_reviewer":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "optimizer":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "youtuber":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <CardHeader className="border-b border-muted/30 bg-muted/10 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Equipo de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Top accent gradient */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <CardHeader className="border-b border-muted/30 bg-muted/10 backdrop-blur-sm flex flex-row items-center justify-between py-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Equipo de Trabajo
        </CardTitle>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`rounded-full p-1.5 ${isConnected ? 'bg-green-500/20' : 'bg-amber-500/20'}`}
                >
                  {isConnected ? 
                    <Wifi className={`h-4 w-4 ${usingFallback ? 'text-amber-500' : 'text-green-500'}`} /> : 
                    <WifiOff className="h-4 w-4 text-gray-500" />
                  }
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Estado de conexión: {isConnected ? (usingFallback ? 'Fallback REST' : 'WebSocket') : 'Desconectado'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Badge variant="outline" className="font-medium">
            {users?.length || 0} miembros / {onlineUsersData.length} en línea
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative p-4 border-b border-muted/30">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 bg-muted/5 border-muted/30 focus:border-primary/40"
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 bg-muted/5 border-b border-muted/30">
          <RoleFilter
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
          />
        </div>
        
        <ScrollArea className="h-[300px]">
          <AnimatePresence>
            <div className="divide-y divide-muted/20">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "hsl(var(--muted) / 0.1)" }}
                  onClick={() => {
                    setSelectedUser({
                      id: user.id.toString(),
                      username: user.username,
                      full_name: user.fullName || "",
                      email: user.email,
                      avatar_url: user.avatarUrl || "", 
                      role: user.role,
                      bio: "",
                      phone: ""
                    });
                    setDetailOpen(true);
                  }}
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors duration-200"
                >
                  <div className="relative">
                    <Avatar className="border-2 border-background shadow-sm">
                      <AvatarImage src={user.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.fullName
                          ? user.fullName.split(" ").map(n => n[0]).join("")
                          : user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Indicador de estado en línea */}
                    {onlineUserIds.has(user.id.toString()) ? (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 h-2.5 w-2.5 rounded-full border-2 border-background"></div>
                    ) : (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-gray-400/50 h-2.5 w-2.5 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="truncate">
                        <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`capitalize text-xs px-2 flex items-center gap-1 ${getRoleBadgeClasses(user.role)}`}
                      >
                        {getRoleIcon(user.role)}
                        <span>
                          {user.role === "admin" ? "Admin" :
                           user.role === "reviewer" ? "Revisor" :
                           user.role === "content_reviewer" ? "Rev. Contenido" :
                           user.role === "media_reviewer" ? "Rev. Media" :
                           user.role === "optimizer" ? "Optimizador" :
                           user.role === "youtuber" ? "YouTuber" : 
                           user.role}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {onlineUserIds.has(user.id.toString()) ? (
                        <>
                          <div className="bg-green-500 h-1.5 w-1.5 rounded-full"></div>
                          <p className="text-xs text-muted-foreground">
                            En línea {usingFallback ? "(REST)" : "(WS)"}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-400/50 h-1.5 w-1.5 rounded-full"></div>
                          <p className="text-xs text-muted-foreground">
                            Desconectado
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No se encontraron usuarios</p>
                  <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm flex items-center gap-2 mx-auto"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedRole("all");
                    }}
                  >
                    <SquareUser className="h-4 w-4" />
                    Mostrar todos
                  </motion.button>
                </div>
              )}
            </div>
          </AnimatePresence>
        </ScrollArea>
        
        <UserDetails 
          user={selectedUser} 
          isOpen={detailOpen} 
          onClose={() => setDetailOpen(false)} 
          isOnline={selectedUser ? onlineUserIds.has(selectedUser.id) : false}
        />
      </CardContent>
    </Card>
  );
};
