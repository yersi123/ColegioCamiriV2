export const maps = {
  estado: { R: 'Registrado', A: 'Activo', X: 'Anulado' },
  sexo: { M: 'Masculino', F: 'Femenino' },
  gestionEstado: { '1': 'Activo', '0': 'Inactivo' },
  pagoEstado: { P: 'Pendiente', C: 'Cancelado', A: 'Anulado' },
  tipoPago: { E: 'Efectivo', Q: 'QR', A: 'Automático' },
  rol: {
    admin: 'Administrador',
    director: 'Director',
    secretaria: 'Secretaria',
    tutor: 'Tutor',
  },
};

export function mapValue(mapName, code) {
  return maps[mapName]?.[code] ?? code;
}
