import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react-native'
import { colors, spacing, typography, radius, shadows } from '@/theme'

const ToastContext = createContext(null)

const VARIANT_CONFIG = {
  success: { bg: colors.success, Icon: CheckCircle2 },
  error: { bg: colors.danger, Icon: XCircle },
  warning: { bg: colors.warning, Icon: AlertTriangle },
  info: { bg: colors.info, Icon: Info },
}

/** Simple event emitter for toast outside React tree */
const listeners = new Set()

export function toast(message, options = {}) {
  const payload =
    typeof message === 'string'
      ? { message, ...options }
      : { ...message, ...options }
  listeners.forEach((fn) => fn(payload))
}

toast.success = (message, options) => toast(message, { ...options, variant: 'success' })
toast.error = (message, options) => toast(message, { ...options, variant: 'error' })
toast.warning = (message, options) => toast(message, { ...options, variant: 'warning' })
toast.info = (message, options) => toast(message, { ...options, variant: 'info' })

function ToastItem({ item, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-12)).current
  const config = VARIANT_CONFIG[item.variant] || VARIANT_CONFIG.info
  const { Icon, bg } = config

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start()

    const duration = item.duration ?? 3000
    if (duration > 0) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -8, duration: 160, useNativeDriver: true }),
        ]).start(() => onHide(item.id))
      }, duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [item, onHide, opacity, translateY])

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bg, opacity, transform: [{ translateY }] },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon size={18} color={colors.white} strokeWidth={2} />
      <View style={styles.toastBody}>
        {item.title ? (
          <Text style={styles.toastTitle} allowFontScaling>
            {item.title}
          </Text>
        ) : null}
        <Text style={styles.toastMessage} allowFontScaling>
          {item.message}
        </Text>
      </View>
      <Pressable
        onPress={() => onHide(item.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={styles.dismiss}
      >
        <X size={16} color={colors.white} />
      </Pressable>
    </Animated.View>
  )
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const insets = useSafeAreaInsets()
  const idRef = useRef(0)

  const hide = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((payload) => {
    const id = ++idRef.current
    const next = {
      id,
      message: payload.message || '',
      title: payload.title,
      variant: payload.variant || 'info',
      duration: payload.duration,
    }
    setItems((prev) => [...prev.slice(-2), next])
    return id
  }, [])

  useEffect(() => {
    listeners.add(show)
    return () => listeners.delete(show)
  }, [show])

  const api = useMemo(
    () => ({
      show,
      success: (message, options) => show({ message, variant: 'success', ...options }),
      error: (message, options) => show({ message, variant: 'error', ...options }),
      warning: (message, options) => show({ message, variant: 'warning', ...options }),
      info: (message, options) => show({ message, variant: 'info', ...options }),
      hide,
    }),
    [show, hide],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.host, { top: insets.top + spacing.sm }]}
      >
        {items.map((item) => (
          <ToastItem key={item.id} item={item} onHide={hide} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      show: toast,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      hide: () => {},
    }
  }
  return ctx
}

/** Presentational toast (single static) — rarely used alone */
export default function Toast({
  visible = true,
  message,
  title,
  variant = 'info',
  onDismiss,
  style,
}) {
  if (!visible || !message) return null
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info
  const { Icon, bg } = config

  return (
    <View style={[styles.toast, { backgroundColor: bg }, style]} accessibilityRole="alert">
      <Icon size={18} color={colors.white} strokeWidth={2} />
      <View style={styles.toastBody}>
        {title ? (
          <Text style={styles.toastTitle} allowFontScaling>
            {title}
          </Text>
        ) : null}
        <Text style={styles.toastMessage} allowFontScaling>
          {message}
        </Text>
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} style={styles.dismiss} accessibilityLabel="Dismiss">
          <X size={16} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    ...shadows.md,
  },
  toastBody: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    ...typography.label,
    color: colors.white,
    fontWeight: '700',
  },
  toastMessage: {
    ...typography.bodySmall,
    color: colors.white,
  },
  dismiss: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
