import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Menu, Bell } from 'lucide-react-native'
import IconButton from '../common/IconButton'
import ConnectionStatusBadge from '../common/ConnectionStatusBadge'
import Avatar from '../common/Avatar'
import { APP_NAME } from '@/config/env'
import { colors, spacing, typography, layout } from '@/theme'

export default function TopHeader({
  title = APP_NAME,
  onMenuPress,
  onNotificationPress,
  onAvatarPress,
  userName,
  userAvatarUri,
  connectionStatus,
  showConnection = false,
  right,
  style,
  accessibilityLabel,
  testID,
}) {
  return (
    <View
      style={[styles.header, style]}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      <View style={styles.left}>
        {onMenuPress ? (
          <IconButton
            icon={Menu}
            onPress={onMenuPress}
            accessibilityLabel="Open menu"
            size="md"
          />
        ) : null}
        <View style={styles.brandBlock}>
          <Text style={styles.brand} allowFontScaling numberOfLines={1}>
            {title}
          </Text>
          {showConnection ? (
            <ConnectionStatusBadge status={connectionStatus || 'disconnected'} />
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {right}
        {onNotificationPress ? (
          <IconButton
            icon={Bell}
            onPress={onNotificationPress}
            accessibilityLabel="Notifications"
            size="md"
          />
        ) : null}
        {(userName || userAvatarUri || onAvatarPress) ? (
          <IconButton
            icon={
              <Avatar name={userName} uri={userAvatarUri} size="sm" />
            }
            onPress={onAvatarPress}
            accessibilityLabel="Profile"
            size="md"
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    minHeight: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  brand: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
})
