/**
 * Pizza desenhada em SVG, fatia por fatia, para o GSAP poder montar,
 * girar e separar as fatias conforme a rolagem. Metade calabresa, metade marguerita.
 */
const R = { crust: 240, sauce: 214, cheese: 205 };
const HALF = (22.5 * Math.PI) / 180;
const wedge = (r: number) => {
  const x = (r * Math.cos(HALF)).toFixed(2);
  const y = (r * Math.sin(HALF)).toFixed(2);
  return `M0 0 L${x} -${y} A${r} ${r} 0 0 1 ${x} ${y} Z`;
};

function Calabresa({ x, y }: { x: number; y: number }) {
  return (
    <g className="topping" transform={`translate(${x} ${y})`}>
      <circle r="19" fill="#B3261A" stroke="#8C1B12" strokeWidth="2.5" />
      <circle r="2.2" cx="-6" cy="-5" fill="#E9A58F" />
      <circle r="1.8" cx="7" cy="2" fill="#E9A58F" />
      <circle r="1.6" cx="-2" cy="9" fill="#E9A58F" />
    </g>
  );
}
function Cebola({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g className="topping" transform={`translate(${x} ${y})`}>
      <circle r={r} fill="none" stroke="#F6EAF3" strokeWidth="3.5" />
      <circle r={r - 5} fill="none" stroke="#E3C7DC" strokeWidth="1.5" />
    </g>
  );
}
function Tomate({ x, y }: { x: number; y: number }) {
  return (
    <g className="topping" transform={`translate(${x} ${y})`}>
      <circle r="17" fill="#E5482F" stroke="#C2301C" strokeWidth="2.5" />
      <circle r="9" fill="none" stroke="#F4937C" strokeWidth="2" strokeDasharray="5 4" />
    </g>
  );
}
function Manjericao({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <g className="topping" transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M-20 0 C-10 -13 10 -13 20 0 C10 13 -10 13 -20 0 Z" fill="#2B7A4B" />
      <path d="M-16 0 L16 0" stroke="#1D5B36" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}
function Azeitona({ x, y }: { x: number; y: number }) {
  return (
    <g className="topping" transform={`translate(${x} ${y})`}>
      <circle r="7.5" fill="#2A2320" />
      <circle r="2.8" fill="#F3CF63" />
    </g>
  );
}

export function PizzaArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-280 -280 560 560" className={className} role="img" aria-label="Pizza meio calabresa, meio marguerita">
      <circle className="pizza-shadow" r="262" cx="10" cy="16" fill="#000" opacity="0.22" />
      <g className="pizza-spin">
        {Array.from({ length: 8 }, (_, i) => {
          const left = i >= 2 && i <= 5;
          return (
            <g key={i} transform={`rotate(${i * 45 + 22.5})`}>
              <g className="slice">
                <path d={wedge(R.crust)} fill="#D99A45" />
                <path className="crust-fill" d={wedge(R.crust - 9)} fill="#E8B766" />
                <path d={wedge(R.sauce)} fill="#C2301C" />
                <path d={wedge(R.cheese)} fill={left ? '#F3C653' : '#F7D878'} />
                <circle cx="150" cy="-30" r="20" fill="#FBE6A0" opacity="0.55" />
                <circle cx="95" cy="16" r="15" fill="#FBE6A0" opacity="0.45" />
                {left ? (
                  <>
                    <Calabresa x={92} y={-10} />
                    <Calabresa x={158} y={34} />
                    <Calabresa x={172} y={-38} />
                    <Cebola x={128} y={-2} />
                    <Cebola x={186} y={2} r={9} />
                    <Azeitona x={58} y={6} />
                  </>
                ) : (
                  <>
                    <Tomate x={150} y={-30} />
                    <Tomate x={100} y={12} />
                    <Manjericao x={168} y={28} rot={i * 37} />
                    <Manjericao x={118} y={-22} rot={i * 61 + 40} />
                    <circle className="topping" cx="186" cy="-6" r="12" fill="#FFFBEF" />
                    <Azeitona x={60} y={-4} />
                  </>
                )}
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
