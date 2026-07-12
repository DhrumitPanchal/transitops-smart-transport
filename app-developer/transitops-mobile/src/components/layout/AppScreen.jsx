import React from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, layout } from '@/theme'

export default function AppScreen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
  keyboardAvoiding = true,
  backgroundColor = colors.background,
  refreshControl,
  testID,
  ...rest
}) {
  const paddingStyle = padded
    ? { paddingHorizontal: layout.screenPadding, paddingVertical: spacing.lg }
    : null

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        paddingStyle,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      {...rest}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, paddingStyle, contentContainerStyle]} {...rest}>
      {children}
    </View>
  )

  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  )

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor }, style]}
      testID={testID}
    >
      {content}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
