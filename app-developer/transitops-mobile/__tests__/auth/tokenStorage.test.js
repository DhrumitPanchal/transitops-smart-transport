import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import tokenManager from '@/api/tokenManager'
import { MOCK_DB_STORAGE_KEY, resetDemoData } from '@/mocks/mockDatabase'

describe('tokenStorage', () => {
  beforeEach(async () => {
    await resetDemoData()
    await tokenManager.clearTokens()
    await AsyncStorage.clear()
    if (typeof SecureStore.__clearMemory === 'function') {
      SecureStore.__clearMemory()
    }
  })

  it('stores tokens in SecureStore, not AsyncStorage', async () => {
    await tokenManager.setTokens({
      accessToken: 'access-abc',
      refreshToken: 'refresh-xyz',
    })

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'transitops.accessToken',
      'access-abc',
    )
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'transitops.refreshToken',
      'refresh-xyz',
    )

    const allKeys = await AsyncStorage.getAllKeys()
    const tokenKeys = allKeys.filter(
      (key) =>
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('access') ||
        key.toLowerCase().includes('refresh'),
    )
    expect(tokenKeys).toEqual([])

    expect(await tokenManager.getAccessToken()).toBe('access-abc')
    expect(await tokenManager.getRefreshToken()).toBe('refresh-xyz')
    expect(await tokenManager.hasTokens()).toBe(true)
  })

  it('clears tokens from SecureStore', async () => {
    await tokenManager.setTokens({
      accessToken: 'access-abc',
      refreshToken: 'refresh-xyz',
    })
    await tokenManager.clearTokens()

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'transitops.accessToken',
    )
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'transitops.refreshToken',
    )
    expect(await tokenManager.hasTokens()).toBe(false)
    expect(await tokenManager.getAccessToken()).toBeNull()
  })

  it('allows mock DB persistence in AsyncStorage without storing auth tokens there', async () => {
    await tokenManager.setTokens({
      accessToken: 'secure-only',
      refreshToken: 'secure-refresh',
    })

    // Mock DB may write to AsyncStorage, but never auth tokens
    const raw = await AsyncStorage.getItem(MOCK_DB_STORAGE_KEY)
    if (raw) {
      expect(raw).not.toContain('secure-only')
      expect(raw).not.toContain('secure-refresh')
      expect(raw).not.toContain('accessToken')
      expect(raw).not.toContain('refreshToken')
    }
  })
})
