import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional()
}).optional();

export const registerSchema = z.object({
  email: z.string().email('Email no válido').transform(v => v.toLowerCase().trim()),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export const verifyCodeSchema = z.object({
  code: z.string().length(6, 'El código debe tener exactamente 6 dígitos').regex(/^\d{6}$/, 'El código debe ser numérico')
});

export const loginSchema = z.object({
  email: z.string().email('Email no válido').transform(v => v.toLowerCase().trim()),
  password: z.string().min(1, 'La contraseña es requerida')
});

export const personalDataSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'Los apellidos son requeridos'),
  nif: z.string().trim().min(1, 'El NIF es requerido')
});

export const companySchema = z.discriminatedUnion('isFreelance', [
  z.object({
    isFreelance: z.literal(true)
  }),
  z.object({
    isFreelance: z.literal(false),
    name: z.string().trim().min(1, 'El nombre de la empresa es requerido'),
    cif: z.string().trim().min(1, 'El CIF es requerido'),
    address: addressSchema
  })
]);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword']
});

export const inviteSchema = z.object({
  email: z.string().email('Email no válido').transform(v => v.toLowerCase().trim()),
  name: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'Los apellidos son requeridos')
});
