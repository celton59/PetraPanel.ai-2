import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

export function useAuth() {
  // Mutación para iniciar sesión
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // Iniciar la sesión de actividad al hacer login
      const loginResponse = await axios.post("/api/login", credentials);
      if (loginResponse.data.success) {
        const sessionResponse = await axios.post("/api/sessions/start", {
          userId: loginResponse.data.user.id,
        });
        // Guardar el ID de sesión para actualizaciones y cierre
        localStorage.setItem("currentSession", sessionResponse.data.id);
      }
      return loginResponse.data;
    },
  });

  // Mutación para cerrar sesión
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const session = localStorage.getItem("currentSession");
      if (session) {
        await axios.post(`/api/sessions/${session}/end`);
        localStorage.removeItem("currentSession");
      }
      return axios.post("/api/logout");
    },
  });

  // Efecto para actualizar la actividad cada minuto
  useEffect(() => {
    const session = localStorage.getItem("currentSession");
    if (!session) return;

    const interval = setInterval(() => {
      axios.post(`/api/sessions/${session}/update-activity`);
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, []);

  return {
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}