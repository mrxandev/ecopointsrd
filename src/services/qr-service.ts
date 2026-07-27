import { buildApiUrl } from "@/config/api";

export type QrSession = {
  qr_session_id?: string;
  id?: string;
  token: string;
  expires_at: string;
};

export type ValidatedQrUserData = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type QrResponse = {
  success?: boolean;
  message?: string;
  data?: QrSession;
};

export async function generateUserQr(authToken: string): Promise<QrSession> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/qr/generate"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch {
    throw new Error("No pudimos conectar con el servidor. Revisa tu conexión.");
  }

  const data = (await response.json().catch(() => null)) as QrResponse | null;

  if (!response.ok) {
    const message = data?.message || "No pudimos generar el código QR.";
    throw new Error(message);
  }

  if (!data?.data?.token) {
    throw new Error("Respuesta inválida al generar el código QR.");
  }

  return data.data;
}

export async function validateQrToken(qrToken: string, authToken: string): Promise<ValidatedQrUserData> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/qr/validate"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: qrToken }),
    });
  } catch {
    throw new Error("No pudimos verificar el código QR. Revisa tu conexión.");
  }

  const data = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: {
      qr?: ValidatedQrUserData;
    };
  } | null;

  if (!response.ok) {
    throw new Error(data?.message || "Código QR inválido, usado o expirado.");
  }

  if (!data?.data?.qr) {
    throw new Error("Respuesta inválida al verificar el código QR.");
  }

  return data.data.qr;
}
