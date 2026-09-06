const SectionHeader = ({ label, title, description, align = 'left' }) => {
  return (
    <div className={`section-header section-header--${align}`}>
      {label && <p className="section-header__label">{label}</p>}
      <h2>{title}</h2>
      {description && <p className="section-header__description">{description}</p>}
    </div>
  )
}

export default SectionHeader
