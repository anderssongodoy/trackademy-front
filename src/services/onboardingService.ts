import { OnboardingFormData, OnboardingResponse, ApiError, Campus, Cycle } from "@/types/onboarding";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

class OnboardingService {
  async submitOnboarding(data: OnboardingFormData): Promise<OnboardingResponse> {
    try {
      const response = await fetch(`${API_BASE}/onboarding/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || "Error al enviar datos de onboarding",
          code: errorData.code,
        } as ApiError;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw {
          status: 500,
          message: error.message,
        } as ApiError;
      }
      throw error;
    }
  }

  async fetchCampuses(): Promise<Campus[]> {
    try {
      const response = await fetch(`${API_BASE}/campuses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
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
        { id: "huancayo", name: "Huancayo" },
      ];
    }
  }

  async fetchCycles(): Promise<Cycle[]> {
    try {
      const response = await fetch(`${API_BASE}/cycles`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener ciclos");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching cycles:", error);
      return [
        { id: 1, label: "Ciclo I", description: "Primer Ciclo" },
        { id: 2, label: "Ciclo II", description: "Segundo Ciclo" },
        { id: 3, label: "Ciclo III", description: "Tercer Ciclo" },
        { id: 4, label: "Ciclo IV", description: "Cuarto Ciclo" },
      ];
    }
  }
}

export const onboardingService = new OnboardingService();
