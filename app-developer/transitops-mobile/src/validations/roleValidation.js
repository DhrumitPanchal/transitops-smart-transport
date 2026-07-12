import { z } from 'zod'
import { ALL_PERMISSIONS } from '../constants/permissions'
import { ROLES } from '../constants/roles'
import { VALIDATION_MESSAGES } from '../constants/validationMessages'
import { trimmedText } from './common'

const permissionSet = new Set(ALL_PERMISSIONS)

export const rolePermissionsSchema = z
  .object({
    roleId: trimmedText({
      requiredMessage: VALIDATION_MESSAGES.ROLE_ID_REQUIRED,
    }),
    roleKey: z.string().optional(),
    permissions: z
      .array(z.string(), {
        error: VALIDATION_MESSAGES.PERMISSIONS_ARRAY,
      })
      .min(1, VALIDATION_MESSAGES.PERMISSIONS_REQUIRED),
  })
  .superRefine((values, ctx) => {
    if (!Array.isArray(values.permissions)) {
      ctx.addIssue({
        code: 'custom',
        path: ['permissions'],
        message: VALIDATION_MESSAGES.PERMISSIONS_ARRAY,
      })
      return
    }

    const hasInvalid = values.permissions.some(
      (permission) => !permissionSet.has(permission),
    )

    if (hasInvalid) {
      ctx.addIssue({
        code: 'custom',
        path: ['permissions'],
        message: VALIDATION_MESSAGES.PERMISSION_INVALID,
      })
    }

    if (values.roleKey === ROLES.SUPER_ADMIN) {
      const missing = ALL_PERMISSIONS.filter(
        (permission) => !values.permissions.includes(permission),
      )

      if (missing.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['permissions'],
          message: VALIDATION_MESSAGES.SUPER_ADMIN_PERMISSIONS_LOCKED,
        })
      }
    }
  })
