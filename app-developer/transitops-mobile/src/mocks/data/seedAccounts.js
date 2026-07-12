/**
 * Development mock login accounts (credentials live in mockDatabase credentials store).
 * Passwords are NEVER attached to public user objects returned by toPublicUser().
 *
 * | Role               | Email                      | Password        |
 * |--------------------|----------------------------|-----------------|
 * | Super Admin        | admin@transitops.com       | Admin@123       |
 * | Fleet Manager      | fleet@transitops.com       | Fleet@123       |
 * | Dispatcher         | dispatcher@transitops.com  | Dispatcher@123  |
 * | Safety Officer     | safety@transitops.com      | Safety@123      |
 * | Financial Analyst  | finance@transitops.com     | Finance@123     |
 */

export const SEED_ACCOUNTS = [
  {
    email: 'admin@transitops.com',
    password: 'Admin@123',
    role: 'SUPER_ADMIN',
    name: 'Priya Sharma',
  },
  {
    email: 'fleet@transitops.com',
    password: 'Fleet@123',
    role: 'FLEET_MANAGER',
    name: 'Arjun Mehta',
  },
  {
    email: 'dispatcher@transitops.com',
    password: 'Dispatcher@123',
    role: 'DISPATCHER',
    name: 'Neha Iyer',
  },
  {
    email: 'safety@transitops.com',
    password: 'Safety@123',
    role: 'SAFETY_OFFICER',
    name: 'Rahul Nair',
  },
  {
    email: 'finance@transitops.com',
    password: 'Finance@123',
    role: 'FINANCIAL_ANALYST',
    name: 'Ananya Gupta',
  },
]

export default SEED_ACCOUNTS
