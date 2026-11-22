import { Fragment } from 'react';
import type { Tick } from './dial';

export interface ScaleMarksProps {
  ticks: readonly Tick[];
  /** Ink for every tick, or per tick index (the S meter turns red past S9) */
  color: string | ((index: number) => string);
  fontSize: number;
  /** Main dial and knob labels follow the arc; meter labels stay upright */
  rotateLabels?: boolean;
  majorWidth?: number;
  minorWidth?: number;
}

/** Printed ticks and numbers of a dial scale, drawn from `scaleTicks`. */
export const ScaleMarks = ({
  ticks,
  color,
  fontSize,
  rotateLabels = false,
  majorWidth = 1.3,
  minorWidth = 0.7,
}: ScaleMarksProps) => (
  <g fontFamily="Oswald, sans-serif" fontSize={fontSize} textAnchor="middle">
    {ticks.map((tick, index) => {
      const ink = typeof color === 'function' ? color(index) : color;
      return (
        <Fragment key={index}>
          <line
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={ink}
            strokeWidth={tick.major ? majorWidth : minorWidth}
          />
          {tick.label && (
            <text
              x={tick.label.x}
              y={tick.label.y}
              dominantBaseline="middle"
              fill={ink}
              transform={
                rotateLabels
                  ? `rotate(${tick.label.angle} ${tick.label.x} ${tick.label.y})`
                  : undefined
              }
            >
              {tick.label.text}
            </text>
          )}
        </Fragment>
      );
    })}
  </g>
);
