import { MAIN_DIAL, arcPath, needleAngle, scaleTicks } from './dial';
import { ScaleMarks } from './ScaleMarks';

const INK = '#2a2620';
const RED = '#b0130a';

const { center, from, to } = MAIN_DIAL;
const MHZ = scaleTicks({
  center,
  radius: 292,
  from,
  to,
  count: 50,
  majorEvery: 5,
  length: 5,
  labels: ['3', '5', '7', '10', '12', '14', '18', '21', '24', '27', '30'],
});
const METERS = scaleTicks({
  center,
  radius: 255,
  from,
  to,
  count: 8,
  majorEvery: 1,
  length: 5,
  labels: ['80', '40', '30', '20', '17', '15', '12', '10', 'M'],
});
const LOG = scaleTicks({
  center,
  radius: 222,
  from,
  to,
  count: 100,
  majorEvery: 10,
  length: 3,
  labels: ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
});

export interface MainDialProps {
  /** Needle position on the band, 0–100 */
  position: number;
  /** Printed at the bottom of the face (band name, or frequency and station) */
  readout: string;
}

/** The big "Megacycles" face: MHz, amateur bands and a 0–100 logging scale, red needle. */
export const MainDial = ({ position, readout }: MainDialProps) => (
  <svg aria-hidden="true" viewBox="0 0 400 200">
    <rect width="400" height="200" fill="#efe3c4" />
    <path d={arcPath(center, 292, from, to)} fill="none" stroke={INK} strokeWidth="1.2" />
    <ScaleMarks ticks={MHZ} color={INK} fontSize={11} rotateLabels />
    <path d={arcPath(center, 255, from, to)} fill="none" stroke={RED} strokeWidth="1" />
    <ScaleMarks ticks={METERS} color={RED} fontSize={11} rotateLabels />
    <path d={arcPath(center, 222, from, to)} fill="none" stroke={INK} strokeWidth="0.9" />
    <ScaleMarks ticks={LOG} color={INK} fontSize={11} rotateLabels />
    <text
      x="200"
      y="188"
      textAnchor="middle"
      fontFamily="Oswald, sans-serif"
      fontSize="9"
      letterSpacing="2"
      fill="#5a4a3a"
    >
      {readout}
    </text>
    <g
      data-testid="dial-needle"
      className="cq-needle"
      style={{
        transformOrigin: '200px 330px',
        transformBox: 'view-box',
        transform: `rotate(${needleAngle(position)}deg)`,
      }}
    >
      <line
        x1="200"
        y1="330"
        x2="200"
        y2="30"
        stroke="rgba(0,0,0,.25)"
        strokeWidth="3"
        transform="translate(2 1)"
      />
      <line x1="200" y1="330" x2="200" y2="30" stroke={RED} strokeWidth="1.8" />
    </g>
  </svg>
);
