import { OnboardingFormData, OnboardingResponse, ApiError, Campus, Cycle, Program } from "@/types/onboarding";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

class OnboardingService {
  async submitOnboarding(data: OnboardingFormData, token?: string): Promise<OnboardingResponse> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/onboarding/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || "Error al enviar datos de onboarding",
        } as ApiError;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
        } as ApiError;
      }
      throw error;
    }
  }

  async fetchCampuses(token?: string): Promise<Campus[]> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("Fetching campuses with token:", token.substring(0, 50) + "...");
      } else {
        console.log("Fetching campuses without token");
      }

      const response = await fetch(`${API_BASE}/campuses`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.error("Campuses fetch failed:", response.status, response.statusText);
        throw new Error("Error al obtener campuses");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching campuses:", error);
      return [
        { id: "lima", name: "Lima" },
        { id: "arequipa", name: "Arequipa" },
        { id: "cusco", name: "Cusco" },
        { id: "chiclayo", name: "Chiclayo" },
      ];
    }
  }

  async fetchCycles(token?: string): Promise<Cycle[]> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/cycles`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Error al obtener ciclos");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching cycles:", error);
      return [
        { id: 1, label: "Ciclo I" },
        { id: 2, label: "Ciclo II" },
        { id: 3, label: "Ciclo III" },
        { id: 4, label: "Ciclo IV" },
      ];
    }
  }

  async fetchPrograms(token?: string): Promise<Program[]> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/programs`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Error al obtener programas");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching programs:", error);
      return [
        { id: "1", name: "Ingeniería Informática" },
        { id: "2", name: "Ingeniería Civil" },
        { id: "3", name: "Ingeniería Industrial" },
        { id: "4", name: "Ingeniería Mecánica" },
      ];
    }
  }
}

export const onboardingService = new OnboardingService();
