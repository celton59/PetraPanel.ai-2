import { UserRole } from "@/types/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (value: UserRole) => void;
}

export const RoleSelector = ({ value, onChange }: RoleSelectorProps) => {
  const roles: { value: UserRole; label: string }[] = [
    { value: "admin", label: "Administrador" },
    { value: "reviewer", label: "Revisor" },
    { value: "optimizer", label: "Optimizador" },
    { value: "youtuber", label: "YouTuber" },
    { value: "uploader", label: "Uploader" },
  ];

  return (
    <Select value={value} onValueChange={(val) => onChange(val as UserRole)}>
      <SelectTrigger>
        <SelectValue placeholder="Selecciona un rol" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};