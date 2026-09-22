import { Link } from 'react-router-dom'

const Button = ({ children, type = 'button', to, className = '', kind = 'primary', size, ...props }) => {
  const sizeClass = size ? `button--${size}` : ''
  const classes = ['button', `button--${kind}`, sizeClass, className].filter(Boolean).join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button

