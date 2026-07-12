import * as authService from '@/services/authService'
import * as fuelService from '@/services/fuelService'
import * as expenseService from '@/services/expenseService'
import { resetDemoData, getDb } from '@/mocks/mockDatabase'
import tokenManager from '@/api/tokenManager'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { EXPENSE_TYPES } from '@/constants/appConstants'
import { hasPermission } from '@/utils/helpers'

async function loginAsAdmin() {
  await authService.login({
    email: 'admin@transitops.com',
    password: 'Admin@123',
  })
}

describe('fuelExpense', () => {
  beforeEach(async () => {
    await resetDemoData()
    await tokenManager.clearTokens()
    await loginAsAdmin()
  })

  describe('fuel logs', () => {
    it('creates a fuel log with cost per litre enrichment', async () => {
      const result = await fuelService.create({
        vehicleId: 'veh_2',
        liters: 40,
        cost: 4200,
        fuelDate: '2026-07-12',
        odometerReading: 78200,
        stationName: 'HPCL Ring Road',
        notes: 'Top up',
      })

      expect(result.data.item.liters).toBe(40)
      expect(result.data.item.cost).toBe(4200)
      expect(result.data.item.costPerLitre).toBe(105)
      expect(result.data.item.vehicleRegistration).toBe('KA02CD5678')
    })

    it('edits a fuel log', async () => {
      const updated = await fuelService.update('fuel_1', {
        liters: 50,
        cost: 5000,
        stationName: 'Updated Station',
      })
      expect(updated.data.item.liters).toBe(50)
      expect(updated.data.item.costPerLitre).toBe(100)
      expect(updated.data.item.stationName).toBe('Updated Station')
    })

    it('deletes a fuel log', async () => {
      await fuelService.remove('fuel_2')
      expect(getDb().fuelLogs.some((item) => item.id === 'fuel_2')).toBe(false)
    })
  })

  describe('expenses', () => {
    it('creates an expense', async () => {
      const result = await expenseService.create({
        vehicleId: 'veh_2',
        tripId: 'trip_2',
        expenseType: EXPENSE_TYPES.FINE,
        amount: 1500,
        expenseDate: '2026-07-12',
        description: 'Speeding fine',
      })
      expect(result.data.item.expenseType).toBe(EXPENSE_TYPES.FINE)
      expect(result.data.item.amount).toBe(1500)
    })

    it('edits an expense', async () => {
      const updated = await expenseService.update('exp_1', {
        amount: 500,
        description: 'Updated toll',
      })
      expect(updated.data.item.amount).toBe(500)
      expect(updated.data.item.description).toBe('Updated toll')
    })

    it('deletes an expense', async () => {
      await expenseService.remove('exp_2')
      expect(getDb().expenses.some((item) => item.id === 'exp_2')).toBe(false)
    })
  })

  describe('permission helpers', () => {
    it('Financial Analyst can CRUD fuel and expenses', () => {
      expect(hasPermission(ROLES.FINANCIAL_ANALYST, PERMISSIONS.FUEL_CREATE)).toBe(
        true,
      )
      expect(hasPermission(ROLES.FINANCIAL_ANALYST, PERMISSIONS.FUEL_EDIT)).toBe(
        true,
      )
      expect(hasPermission(ROLES.FINANCIAL_ANALYST, PERMISSIONS.FUEL_DELETE)).toBe(
        true,
      )
      expect(
        hasPermission(ROLES.FINANCIAL_ANALYST, PERMISSIONS.EXPENSES_CREATE),
      ).toBe(true)
      expect(
        hasPermission(ROLES.FINANCIAL_ANALYST, PERMISSIONS.EXPENSES_EDIT),
      ).toBe(true)
      expect(
        hasPermission(ROLES.FINANCIAL_ANALYST, PERMISSIONS.EXPENSES_DELETE),
      ).toBe(true)
    })

    it('Safety Officer cannot access fuel or expenses modules', () => {
      expect(hasPermission(ROLES.SAFETY_OFFICER, PERMISSIONS.FUEL_VIEW)).toBe(
        false,
      )
      expect(hasPermission(ROLES.SAFETY_OFFICER, PERMISSIONS.EXPENSES_VIEW)).toBe(
        false,
      )
    })

    it('Dispatcher can create but not edit/delete fuel and expenses', () => {
      expect(hasPermission(ROLES.DISPATCHER, PERMISSIONS.FUEL_CREATE)).toBe(true)
      expect(hasPermission(ROLES.DISPATCHER, PERMISSIONS.FUEL_EDIT)).toBe(false)
      expect(hasPermission(ROLES.DISPATCHER, PERMISSIONS.FUEL_DELETE)).toBe(false)
      expect(hasPermission(ROLES.DISPATCHER, PERMISSIONS.EXPENSES_CREATE)).toBe(
        true,
      )
      expect(hasPermission(ROLES.DISPATCHER, PERMISSIONS.EXPENSES_EDIT)).toBe(
        false,
      )
      expect(hasPermission(ROLES.DISPATCHER, PERMISSIONS.EXPENSES_DELETE)).toBe(
        false,
      )
    })

    it('Fleet Manager can view fuel/expenses but not mutate', () => {
      expect(hasPermission(ROLES.FLEET_MANAGER, PERMISSIONS.FUEL_VIEW)).toBe(true)
      expect(hasPermission(ROLES.FLEET_MANAGER, PERMISSIONS.FUEL_CREATE)).toBe(
        false,
      )
      expect(hasPermission(ROLES.FLEET_MANAGER, PERMISSIONS.EXPENSES_VIEW)).toBe(
        true,
      )
      expect(hasPermission(ROLES.FLEET_MANAGER, PERMISSIONS.EXPENSES_CREATE)).toBe(
        false,
      )
    })
  })
})
