const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!data.success) throw { status: res.status, ...data };
  return data;
}

export const api = {
  request: (method, path, token, body) => request(method, path, token, body),
  login: (body) => request('POST', '/auth/login', null, body),
  cambiarContrasena: (token, body) => request('PUT', '/auth/cambiar-contrasena', token, body),

  personas: {
    listar: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/personas${q ? '?' + q : ''}`, token);
    },
    obtener: (token, ci) => request('GET', `/personas/${ci}`, token),
    crear: (token, data) => request('POST', '/personas', token, data),
    actualizar: (token, ci, data) => request('PUT', `/personas/${ci}`, token, data),
    eliminar: (token, ci) => request('DELETE', `/personas/${ci}`, token),
  },

  usuarios: {
    listar: (token, rol, params = {}) => {
      const q = new URLSearchParams({ rol, ...params }).toString();
      return request('GET', `/usuarios?${q}`, token);
    },
    obtener: (token, rol, ci) => request('GET', `/usuarios/${ci}?rol=${rol}`, token),
    crear: (token, data) => request('POST', '/usuarios', token, data),
    actualizar: (token, rol, ci, data) => request('PUT', `/usuarios/${ci}?rol=${rol}`, token, data),
    eliminar: (token, rol, ci) => request('DELETE', `/usuarios/${ci}?rol=${rol}`, token),
    restablecer: (token, rol, ci) => request('PUT', `/usuarios/${ci}/restablecer?rol=${rol}`, token),
    activar: (token, rol, ci) => request('PUT', `/usuarios/${ci}/activar?rol=${rol}`, token),
  },

  niveles: {
    listar: (token) => request('GET', '/niveles', token),
    obtener: (token, id) => request('GET', `/niveles/${id}`, token),
    crear: (token, data) => request('POST', '/niveles', token, data),
    actualizar: (token, id, data) => request('PUT', `/niveles/${id}`, token, data),
  },

  becas: {
    listar: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/becas${q ? '?' + q : ''}`, token);
    },
    obtener: (token, id) => request('GET', `/becas/${id}`, token),
    crear: (token, data) => request('POST', '/becas', token, data),
    actualizar: (token, id, data) => request('PUT', `/becas/${id}`, token, data),
    asignarMatricula: (token, idmatriculacion, codbeca) => request('PUT', `/matriculacion/${idmatriculacion}/beca`, token, { codbeca }),
  },

  aportes: {
    listar: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/aportes${q ? '?' + q : ''}`, token);
    },
    pagar: (token, id, data) => request('PUT', `/aportes/${id}/pagar`, token, data),
    completar: (token, data) => request('POST', '/aportes/completar', token, data),
  },

  mensualidades: {
    listar: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/mensualidades${q ? '?' + q : ''}`, token);
    },
    obtener: (token, idmat, idmen) => request('GET', `/mensualidades/${idmat}/${idmen}`, token),
    crear: (token, data) => request('POST', '/mensualidades', token, data),
    actualizar: (token, idmat, idmen, data) => request('PUT', `/mensualidades/${idmat}/${idmen}`, token, data),
    pagar: (token, idmat, idmen, data) => request('PUT', `/mensualidades/${idmat}/${idmen}/pagar`, token, data),
    pagarTodo: (token, idmat, data) => request('POST', `/mensualidades/${idmat}/pagar-todo`, token, data),
    deudores: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/mensualidades/deudores${q ? '?' + q : ''}`, token);
    },
    historial: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/mensualidades/historial${q ? '?' + q : ''}`, token);
    },
    completar: (token, data) => request('POST', '/mensualidades/completar', token, data),
  },

  cursos: {
    listar: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/cursos${q ? '?' + q : ''}`, token);
    },
    crear: (token, data) => request('POST', '/cursos', token, data),
    actualizar: (token, id, data) => request('PUT', `/cursos/${id}`, token, data),
  },

  gestiones: {
    listar: (token) => request('GET', '/gestiones', token),
    obtener: (token, id) => request('GET', `/gestiones/${id}`, token),
    crear: (token, data) => request('POST', '/gestiones', token, data),
    actualizar: (token, id, data) => request('PUT', `/gestiones/${id}`, token, data),
    cambiarEstado: (token, id) => request('PUT', `/gestiones/${id}/estado`, token),
    asignarPrecio: (token, data) => request('POST', '/detallegestion', token, data),
  },

  matriculacion: {
    listar: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/matriculacion${q ? '?' + q : ''}`, token);
    },
    obtener: (token, id) => request('GET', `/matriculacion/${id}`, token),
    crear: (token, data) => request('POST', '/matriculacion', token, data),
    actualizar: (token, id, data) => request('PUT', `/matriculacion/${id}`, token, data),
    cambiarEstado: (token, id, estado) => request('PUT', `/matriculacion/${id}/estado`, token, { estado }),
    verificarDeudas: (token, ci, idgestion) => request('GET', `/matriculacion/verificar-deudas?ci=${encodeURIComponent(ci)}&gestion=${idgestion}`, token),
  },

  secretaria: {
    listarTutores: (token) => request('GET', '/secretaria/tutores', token),
    listarHijosTutor: (token, ci) => request('GET', `/secretaria/tutores/${ci}/hijos`, token),
    listarEstudiantes: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/secretaria/estudiantes${q ? '?' + q : ''}`, token);
    },
    nextCodigoEstudiante: (token) => request('GET', '/secretaria/estudiantes/next-code', token),
    listarEstudiantesSinTutor: (token) => request('GET', '/secretaria/estudiantes-sin-tutor', token),
    asignarTutor: (token, ciEstudiante, citutor) => request('PUT', `/secretaria/estudiantes/${ciEstudiante}/asignar-tutor`, token, { citutor }),
    crearEstudiante: (token, data) => request('POST', '/secretaria/estudiantes', token, data),
    crearTutor: (token, data) => request('POST', '/secretaria/tutores', token, data),
    restablecerTutor: (token, ci) => request('PUT', `/secretaria/tutores/${ci}/restablecer`, token),
    activarTutor: (token, ci) => request('PUT', `/secretaria/tutores/${ci}/activar`, token),
    desactivarTutor: (token, ci) => request('PUT', `/secretaria/tutores/${ci}/desactivar`, token),
  },

  reportes: {
    matricula: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/reportes/matricula${q ? '?' + q : ''}`, token);
    },
    mora: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/reportes/mora${q ? '?' + q : ''}`, token);
    },
    ingresos: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/reportes/ingresos${q ? '?' + q : ''}`, token);
    },
    becas: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/reportes/becas${q ? '?' + q : ''}`, token);
    },
  },

  tutor: {
    listarHijos: (token) => request('GET', '/tutor/hijos', token),
    listarMensualidadesHijo: (token, ci, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request('GET', `/tutor/hijos/${ci}/mensualidades${q ? '?' + q : ''}`, token);
    },
    listarAportesHijo: (token, ci) => request('GET', `/tutor/hijos/${ci}/aportes`, token),
  },
};
