// ============================================================================
// lib/env.ts
// ----------------------------------------------------------------------------
// El front usa el API Gateway como puerta de entrada para todos los módulos.
//
// El Gateway enruta los módulos integrados a sus servicios internos.
//
// El valor real se define en ".env.local" (ver ".env.example").
// ============================================================================

export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";
