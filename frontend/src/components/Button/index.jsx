import { Link } from 'react-router-dom'

const Button = ({ children, type = 'button', to, className = '', kind = 'primary', ...props }) => {
  const classes = ['button', `button--${kind}`, className].filter(Boolean).join(' ')

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
