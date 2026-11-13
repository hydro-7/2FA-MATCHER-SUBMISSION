export function Stepper({ steps, current }) {
  return (
    <ol className="stepper">
      {steps.map((label, index) => (
        <li key={label} className={index < current ? "done" : index === current ? "current" : ""}>
          <span className="step-dot">{index + 1}</span>
          <span className="step-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}
