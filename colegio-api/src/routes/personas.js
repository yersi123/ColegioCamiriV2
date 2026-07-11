import { z } from "zod";
import { parseBody, getQuery } from "../lib/request.js";
import { respond } from "../lib/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { NotFoundError } from "../lib/errors.js";
import {
  listarPersonas,
  obtenerPersona,
  crearPersona,
  actualizarPersona,
  eliminarPersona,
} from "../servicios/personas.service.js";

const createSchema = z.object({
  ci: z.string().min(6, "CI requerido").max(10, "CI máximo 10 caracteres"),
  nombre: z.string().min(3, "Nombre requerido").max(100),
  apellido: z.string().min(3, "Apellido requerido").max(100),
  sexo: z.enum(["M", "F"], { message: "Sexo debe ser M o F" }),
  telefono: z
    .string()
    .regex(/^\d{8}$/, "Teléfono debe tener 8 dígitos")
    .optional()
    .or(z.literal("")),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
});

const updateSchema = z.object({
  nombre: z.string().min(3, "Nombre requerido").max(100),
  apellido: z.string().min(3, "Apellido requerido").max(100),
  sexo: z.enum(["M", "F"], { message: "Sexo debe ser M o F" }),
  telefono: z
    .string()
    .regex(/^\d{8}$/, "Teléfono debe tener 8 dígitos")
    .optional()
    .or(z.literal("")),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
});

const ciSchema = z.string().min(5, "CI mínimo 5 caracteres").max(10, "CI máximo 10 caracteres");

const rolesConPermisoEscritura = ["admin", "secretaria"];
const rolesConPermisoLectura = ["admin", "secretaria", "director"];

export function personasRouter(router) {
  router.get("/personas", async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole(...rolesConPermisoLectura)(userHolder.user);

      const query = getQuery(req);
      const result = await listarPersonas(query);
      respond(res, 200, true, result, "Personas listadas");
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get("/personas/:ci", async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole(...rolesConPermisoLectura)(userHolder.user);

      const ci = ciSchema.parse(params.ci);
      const persona = await obtenerPersona(ci);
      if (!persona) throw new NotFoundError("Persona");
      respond(res, 200, true, persona, "Persona encontrada");
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post("/personas", async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole(...rolesConPermisoEscritura)(userHolder.user);

      const body = await parseBody(req);
      const data = createSchema.parse(body);
      const result = await crearPersona(data);
      respond(res, 201, true, result, "Persona creada");
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put("/personas/:ci", async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole(...rolesConPermisoEscritura)(userHolder.user);

      const ci = ciSchema.parse(params.ci);
      const body = await parseBody(req);
      const data = updateSchema.parse(body);
      const result = await actualizarPersona(ci, data);
      respond(res, 200, true, result, "Persona actualizada");
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      console.error('Error al actualizar persona:', err);
      respond(res, 500, false, null, err.message || 'Error interno del servidor');
    }
  });

  router.delete("/personas/:ci", async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole(...rolesConPermisoEscritura)(userHolder.user);

      const ci = ciSchema.parse(params.ci);
      const result = await eliminarPersona(ci);
      if (!result) throw new NotFoundError("Persona");
      respond(res, 200, true, result, "Persona desactivada");
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
