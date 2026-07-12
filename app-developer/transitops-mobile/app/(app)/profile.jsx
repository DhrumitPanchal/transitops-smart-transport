import { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/hooks/auth/useAuth'
import { useToast } from '@/components/feedback/Toast'
import { getRoleLabel } from '@/utils/helpers'
import { formatDateTime } from '@/utils/formatters'
import { getErrorMessage } from '@/api/apiError'
import { USE_MOCKS } from '@/config/env'
import { resetMockDemoData } from '@/services/authService'
import AppScreen from '@/components/layout/AppScreen'
import SectionTitle from '@/components/common/SectionTitle'
import Card from '@/components/common/Card'
import Avatar from '@/components/common/Avatar'
import RoleBadge from '@/components/common/RoleBadge'
import StatusBadge from '@/components/common/StatusBadge'
import Button from '@/components/common/Button'
import ConfirmModal from '@/components/feedback/ConfirmModal'
import { colors, spacing, typography } from '@/theme'

export default function ProfileScreen() {
  const router = useRouter()
  const toast = useToast()
  const {
    user,
    role,
    status,
    permissions,
    logout,
    forceLogout,
    isLoading,
    isPending,
  } = useAuth()

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [resetting, setResetting] = useState(false)

  const displayName = user?.name || user?.fullName || 'User'
  const permissionSummary = useMemo(() => {
    if (isPending) {
      return 'Limited access while approval is pending. Dashboard and profile only.'
    }
    if (!permissions?.length) {
      return 'No module permissions assigned yet.'
    }
    if (permissions.length > 12) {
      return `${permissions.length} permissions granted (including full operational access).`
    }
    return permissions.join(' · ')
  }, [isPending, permissions])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logout()
      setLogoutOpen(false)
      router.replace('/(auth)/login')
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to log out')
    } finally {
      setLoggingOut(false)
    }
  }, [logout, router, toast])

  const handleResetDemoData = useCallback(async () => {
    if (resetting) return
    setResetting(true)
    try {
      await resetMockDemoData()
      await forceLogout()
      toast.success('Demo data reset. Please sign in again.')
      router.replace('/(auth)/login')
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Unable to reset demo data')
    } finally {
      setResetting(false)
    }
  }, [forceLogout, resetting, router, toast])

  const showReset = typeof __DEV__ !== 'undefined' && __DEV__ && USE_MOCKS

  return (
    <AppScreen scroll>
      <SectionTitle
        title="Profile"
        subtitle="Your account details and access summary."
      />

      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <Avatar name={displayName} uri={user?.avatarUrl} size="lg" />
          <View style={styles.heroMeta}>
            <Text style={styles.name} allowFontScaling>
              {displayName}
            </Text>
            <Text style={styles.email} allowFontScaling>
              {user?.email || '—'}
            </Text>
            <View style={styles.badgeRow}>
              {role ? <RoleBadge role={role} /> : null}
              <StatusBadge status={status || user?.status} />
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionHeading} allowFontScaling>
          Account
        </Text>
        <DetailRow label="Role" value={getRoleLabel(role)} />
        <DetailRow label="Status" value={status || user?.status || '—'} />
        <DetailRow
          label="Member since"
          value={formatDateTime(user?.createdAt)}
        />
        <DetailRow
          label="User ID"
          value={user?.id ? String(user.id) : '—'}
          last
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionHeading} allowFontScaling>
          Permissions
        </Text>
        <Text
          style={styles.permissionText}
          allowFontScaling
          accessibilityLabel={`Permissions summary: ${permissionSummary}`}
        >
          {permissionSummary}
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Log out"
          variant="danger"
          onPress={() => setLogoutOpen(true)}
          loading={loggingOut || isLoading}
          fullWidth
          accessibilityLabel="Log out"
          accessibilityHint="Opens confirmation before signing out"
        />
        {showReset ? (
          <Button
            title="Reset Demo Data"
            variant="outline"
            onPress={handleResetDemoData}
            loading={resetting}
            fullWidth
            accessibilityLabel="Reset demo data"
            accessibilityHint="Clears mock data and returns to login"
            style={styles.resetBtn}
          />
        ) : null}
      </View>

      <ConfirmModal
        visible={logoutOpen}
        title="Sign out"
        message="Are you sure you want to sign out of TransitOps?"
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        destructive
        loading={loggingOut}
        onCancel={() => (loggingOut ? null : setLogoutOpen(false))}
        onConfirm={handleLogout}
      />
    </AppScreen>
  )
}

function DetailRow({ label, value, last = false }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel} allowFontScaling>
        {label}
      </Text>
      <Text style={styles.detailValue} allowFontScaling numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroMeta: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  email: {
    ...typography.body,
    color: colors.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  permissionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  resetBtn: {
    marginTop: spacing.xs,
  },
})
