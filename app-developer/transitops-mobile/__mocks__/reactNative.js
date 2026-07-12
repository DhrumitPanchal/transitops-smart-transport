module.exports = {
  useWindowDimensions: jest.fn(() => ({ width: 390, height: 844 })),
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
    hairlineWidth: 1,
  },
  Platform: {
    OS: 'ios',
    select: (spec) => (spec && (spec.ios ?? spec.default)) || spec,
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
}
