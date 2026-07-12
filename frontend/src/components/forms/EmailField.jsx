import TextField from './TextField'

export default function EmailField(props) {
  return (
    <TextField
      type="email"
      autoComplete={props.autoComplete || 'email'}
      {...props}
    />
  )
}
