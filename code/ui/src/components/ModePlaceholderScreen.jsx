/** Pannello placeholder leggero (stato, impostazioni, ecc.). */
export default function ModePlaceholderScreen({ title, subtitle }) {
  return (
    <div className="mode-placeholder-screen">
      <h1 className="mode-placeholder-screen__title">{title}</h1>
      <p className="mode-placeholder-screen__subtitle">{subtitle}</p>
    </div>
  )
}
