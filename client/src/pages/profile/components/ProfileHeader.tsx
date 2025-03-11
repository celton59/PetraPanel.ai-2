import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarUpload } from "../AvatarUpload";
import { User } from "@db/schema";

interface ProfileHeaderProps {
  user: User | null;
  refetch: () => Promise<any>;
}

export function ProfileHeader({ user, refetch }: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden bg-card">
      <div className="relative p-6">
        <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <AvatarUpload
            url={user?.avatarUrl}
            onUploadComplete={refetch}
            size="lg"
          />
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-semibold text-primary">
              {user?.username || 'Usuario'}
            </h2>
            <p className="text-muted-foreground">
              {user?.email || 'usuario@example.com'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge variant="outline" className="capitalize">
                {user?.role || 'Usuario'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}