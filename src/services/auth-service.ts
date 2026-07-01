import { API_LOGIN_PATH, buildApiUrl } from "@/config/api";

export type UserRole = "USER" | "AGENT" | "ADMIN";

export type AuthUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  user: AuthUser;
  token: string;
};

type BackendLoginResponse =
  | LoginResponse
  | {
      success?: boolean;
      message?: string;
      data?: {
        user?: AuthUser;
        token?: string;
        id?: string;
        first_name?: string;
        last_name?: string;
        name?: string;
        email?: string;
        role?: UserRole;
      };
    };

function getErrorMessage(data: unknown) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "No pudimos iniciar sesion. Revisa tus credenciales.";
}

function normalizeLoginResponse(data: BackendLoginResponse | null): LoginResponse | null {
  if (!data) {
    return null;
  }

  if ("token" in data && "user" in data && data.token && data.user?.role) {
    return data;
  }

  if ("data" in data && data.data?.token) {
    const user =
      data.data.user ??
      (data.data.email && data.data.role
        ? {
            id: data.data.id ?? data.data.email,
            first_name: data.data.first_name,
            last_name: data.data.last_name,
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
          }
        : null);

    if (user?.email && user.role) {
      return {
        token: data.data.token,
        user,
      };
    }
  }

  return null;
}

export async function loginRequest(email: string, password: string) {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(API_LOGIN_PATH), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("Servidor no disponible. Intenta de nuevo en unos minutos.");
  }

  const data = (await response.json().catch(() => null)) as BackendLoginResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  const loginData = normalizeLoginResponse(data);

  if (!loginData) {
    throw new Error("La respuesta del servidor no incluye una sesion valida.");
  }

  return loginData;
}
