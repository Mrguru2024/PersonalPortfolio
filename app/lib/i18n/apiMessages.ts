import { getClientLocale } from "./runtime";

/** Exact English API `message` strings → Spanish (login, register, common API copy). */
const API_EN_TO_ES: Record<string, string> = {
  "Invalid username or password": "Usuario o contraseña no válidos",
  "Too many login attempts. Try again later.": "Demasiados intentos de inicio de sesión. Inténtelo más tarde.",
  "Username and password are required": "Se requieren usuario y contraseña",
  "Invalid request body": "Cuerpo de solicitud no válido",
  "Too many registration attempts. Try again later.": "Demasiados intentos de registro. Inténtelo más tarde.",
  "Username, email, and password are required": "Se requieren usuario, correo y contraseña",
  "Username already exists": "El usuario ya existe",
  "Error creating user": "Error al crear el usuario",
  "Error verifying password": "Error al verificar la contraseña",
  "Error creating session": "Error al crear la sesión",
  "Error setting up session": "Error al configurar la sesión",
  "Please check your credentials and try again": "Revise sus credenciales e inténtelo de nuevo",
  "Please try a different username": "Pruebe con otro nombre de usuario",
};

const DB_SIGN_IN_HINT_EN =
  "Sign-in failed (database). If you upgraded the app, run npm run db:push with your DATABASE_URL, then retry.";

const DB_SIGN_IN_HINT_ES =
  "Error al iniciar sesión (base de datos). Si actualizó la aplicación, ejecute npm run db:push con DATABASE_URL e inténtelo de nuevo.";

/** Best-effort translation for server-supplied English messages shown in toasts. */
export function translateApiMessage(message: string): string {
  if (!message || getClientLocale() === "en") return message;
  const trimmed = message.trim();
  const mapped = API_EN_TO_ES[trimmed];
  if (mapped) return mapped;
  if (trimmed.includes("Sign-in failed (database)")) {
    return DB_SIGN_IN_HINT_ES;
  }
  if (trimmed.startsWith("Database error:")) {
    return `Error de base de datos: ${trimmed.replace(/^Database error:\s*/i, "")}`;
  }
  return message;
}
