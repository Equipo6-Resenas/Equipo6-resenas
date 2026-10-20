// ============================================================================
// lib/env.ts
// ----------------------------------------------------------------------------
// La mayoría de los módulos usan el API Gateway como puerta de entrada.
// Reseñas permite configurar una URL directa para el backend durante el
// desarrollo local (NEXT_PUBLIC_RESENAS_API_URL).
//
// El Gateway enruta los módulos integrados a sus servicios internos.
//
// El valor real se define en ".env.local" (ver ".env.example").
// ============================================================================

export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";
