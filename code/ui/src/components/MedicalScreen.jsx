import StatusCard from './StatusCard.jsx'

export default function MedicalScreen() {
  return (
    <div className="medical-screen">
      <p className="side-heading">Dati medici</p>
      <div className="medical-screen__grid">
        <StatusCard title="Frequenza cardiaca" value="—" detail="In attesa dati" />
        <StatusCard title="SpO₂" value="—" detail="In attesa dati" />
        <StatusCard title="Temperatura" value="—" detail="In attesa dati" />
        <StatusCard title="Sonno" value="—" detail="In attesa dati" />
      </div>
    </div>
  )
}

