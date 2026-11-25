INSERT INTO eventos (id_evento, nombre_evento, descripcion_evento, fecha_evento, id_organizador) VALUES
  ('6b046f8a776147b586753c38', 'Evento Ticket-U (demo)', 'Datos de prueba', '2026-11-25 09:30:00', 1),
  ('6b06041c01bbdc138427b5e2', 'Evento Ticket-U (demo)', 'Datos de prueba', '2026-11-25 09:30:00', 1),
  ('6b05851901bbdc138427b5d2', 'Evento Ticket-U (demo)', 'Datos de prueba', '2026-11-25 09:30:00', 1)
ON CONFLICT (id_evento) DO NOTHING;

INSERT INTO resenas (id_usuario, id_evento, clasificacion, descripcion) VALUES
  (1, '6b046f8a776147b586753c38', 5, 'Excelente organización.'),
  (2, '6b046f8a776147b586753c38', 4, 'Muy buena experiencia.'),
  (3, '6b046f8a776147b586753c38', 3, 'Cumplió, pero faltó tiempo.'),
  (1, '6b06041c01bbdc138427b5e2', 4, 'Buen evento.'),
  (2, '6b06041c01bbdc138427b5e2', 5, 'Muy recomendable.')
ON CONFLICT DO NOTHING;
