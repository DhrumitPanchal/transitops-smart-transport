import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ToastProvider } from '@/components/feedback/Toast'
import { AuthProvider } from '@/context/AuthContext'
import { RealtimeProvider } from '@/context/RealtimeContext'
import Button from '@/components/common/Button'
import { colors, spacing, typography } from '@/theme'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={styles.errorRoot}
          accessibilityRole="alert"
          accessibilityLabel="Something went wrong"
        >
          <Text style={styles.errorTitle} allowFontScaling>
            Something went wrong
          </Text>
          <Text style={styles.errorMessage} allowFontScaling>
            {this.state.error?.message ||
              'An unexpected error occurred. Please try again.'}
          </Text>
          <Button
            title="Try again"
            onPress={this.handleRetry}
            accessibilityLabel="Try again"
            style={styles.errorButton}
          />
        </View>
      )
    }

    return this.props.children
  }
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <RealtimeProvider>
                <RootErrorBoundary>
                  <StatusBar style="dark" />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(app)" />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </RootErrorBoundary>
              </RealtimeProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.background,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 360,
  },
  errorButton: {
    minWidth: 140,
  },
})
