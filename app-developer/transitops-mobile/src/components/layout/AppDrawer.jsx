import React from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LogOut, RotateCcw } from 'lucide-react-native'
import Avatar from '../common/Avatar'
import RoleBadge from '../common/RoleBadge'
import ConnectionStatusBadge from '../common/ConnectionStatusBadge'
import { APP_NAME, USE_MOCKS } from '@/config/env'
import { colors, spacing, typography, radius } from '@/theme'

/**
 * Drawer content panel — pass as drawerContent or render inside a Drawer.
 * items: [{ id, label, icon, to, onPress, active? }]
 */
export default function AppDrawer({
  items = [],
  user,
  activeRoute,
  onNavigate,
  onLogout,
  onResetDemoData,
  connectionStatus = 'disconnected',
  showConnection = true,
  style,
  testID,
}) {
  const insets = useSafeAreaInsets()
  const showReset = typeof __DEV__ !== 'undefined' && __DEV__ && USE_MOCKS

  const displayName = user?.name || user?.fullName || user?.email || 'User'
  const role = user?.role || user?.roleName

  return (
    <View
      style={[
        styles.drawer,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.brandRow}>
        <Text style={styles.brand} allowFontScaling>
          {APP_NAME}
        </Text>
        {showConnection ? (
          <ConnectionStatusBadge status={connectionStatus} />
        ) : null}
      </View>

      <Pressable
        style={styles.userCard}
        onPress={() => onNavigate?.({ id: 'profile', to: '/profile' })}
        accessibilityRole="button"
        accessibilityLabel={`Signed in as ${displayName}`}
      >
        <Avatar name={displayName} uri={user?.avatarUrl} size="md" />
        <View style={styles.userMeta}>
          <Text style={styles.userName} allowFontScaling numberOfLines={1}>
            {displayName}
          </Text>
          {user?.email ? (
            <Text style={styles.userEmail} allowFontScaling numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
          {role ? <RoleBadge role={role} size="sm" style={styles.roleBadge} /> : null}
        </View>
      </Pressable>

      <ScrollView
        style={styles.nav}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const Icon = item.icon
          const active =
            item.active ??
            (activeRoute != null &&
              (item.to === activeRoute || item.id === activeRoute))
          return (
            <Pressable
              key={item.id || item.to || item.label}
              onPress={() => {
                item.onPress?.()
                onNavigate?.(item)
              }}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              {Icon ? (
                <Icon
                  size={20}
                  color={active ? colors.primaryLight : colors.sidebarMuted}
                  strokeWidth={2}
                />
              ) : null}
              <Text
                style={[styles.navLabel, active && styles.navLabelActive]}
                allowFontScaling
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <View style={styles.footer}>
        {showReset && onResetDemoData ? (
          <Pressable
            onPress={onResetDemoData}
            style={({ pressed }) => [
              styles.resetBtn,
              pressed && styles.navItemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset demo data"
          >
            <RotateCcw size={16} color={colors.primaryLight} strokeWidth={2} />
            <Text style={styles.resetText} allowFontScaling>
              Reset Demo Data
            </Text>
          </Pressable>
        ) : null}
        {onLogout ? (
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.logout,
              pressed && styles.navItemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <LogOut size={18} color={colors.sidebarMuted} strokeWidth={2} />
            <Text style={styles.logoutText} allowFontScaling>
              Log out
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: colors.sidebar,
    paddingHorizontal: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  brand: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.sidebarHover,
    marginBottom: spacing.lg,
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    ...typography.body,
    color: colors.sidebarText,
    fontWeight: '600',
  },
  userEmail: {
    ...typography.caption,
    color: colors.sidebarMuted,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: spacing.xs,
  },
  nav: {
    flex: 1,
  },
  navContent: {
    gap: spacing.xxs,
    paddingBottom: spacing.lg,
  },
  navItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  navItemActive: {
    backgroundColor: colors.sidebarHover,
  },
  navItemPressed: {
    backgroundColor: colors.sidebarHover,
  },
  navLabel: {
    ...typography.body,
    color: colors.sidebarMuted,
    flex: 1,
  },
  navLabelActive: {
    color: colors.sidebarText,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.sidebarHover,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  resetBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sidebarMuted,
  },
  resetText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  logout: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  logoutText: {
    ...typography.body,
    color: colors.sidebarMuted,
    fontWeight: '600',
  },
})
