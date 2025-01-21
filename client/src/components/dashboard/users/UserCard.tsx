import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";
import { User } from "@/types/user";

interface UserCardProps {
  user: User;
  isOnline?: boolean;
  onSelect?: (user: User) => void;
}

export function UserCard({ user, isOnline, onSelect }: UserCardProps) {
  return (
    <Card 
      className="p-4 hover:bg-accent/5 transition-colors cursor-pointer"
      onClick={() => onSelect?.(user)}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.username[0]}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-base font-medium">{user.fullName || user.username}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}