// Production domain isn't live yet (see Pendientes/Decisiones en la bóveda — el despliegue está
// explícitamente pospuesto), so this defaults to the intended future domain rather than a
// placeholder — update NEXT_PUBLIC_SITE_URL once patilandia.com.co is actually serving traffic.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://patilandia.com.co";

export const SITE_NAME = "Patilandia";
export const SITE_TAGLINE = "Un mundo hecho para ellos";
