/**
 * Compatibility re-export.
 * Shared mock state lives in mockDatabase.js — do not add a second copy here.
 */
export {
  getDb,
  resetDb,
  getCredentialStore,
  findCredentialByEmail,
  upsertCredential,
  syncCredentialEmail,
  getRolePermissions,
  toPublicUser,
} from './mockDatabase'
