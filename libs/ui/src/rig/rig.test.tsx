import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '../test/renderWithI18n';
import { DeskMicrophone } from './DeskMicrophone';
import { OnAirLamp } from './OnAirLamp';
import { Receiver } from './Receiver';
import type { ReceiverProps } from './Receiver';
import { Rig } from './Rig';
import { SMeter } from './SMeter';
import { SplitStage } from './SplitStage';

const receiver = (props: Partial<ReceiverProps> = {}) => (
  <Receiver
    position={44}
    readout="BANDA MUNDIAL · 3–30"
    onAir={false}
    soundOn
    onToggleSound={() => {}}
    display={<p>display</p>}
    {...props}
  />
);

describe('Receiver', () => {
  it('uses the brand nameplate as the page heading', () => {
    renderWithI18n(receiver());
    expect(screen.getByRole('heading', { level: 1, name: 'CQ talk' })).toBeInTheDocument();
    expect(screen.getByText('SSB TRANSCEIVER · MODEL 69')).toBeInTheDocument();
    expect(screen.getByText('display')).toBeInTheDocument();
  });

  it('prints the readout on the dial and moves the needle and knob together', () => {
    renderWithI18n(receiver());
    expect(screen.getByText('BANDA MUNDIAL · 3–30')).toBeInTheDocument();
    expect(screen.getByTestId('dial-needle').style.transform).toBe('rotate(-4.56deg)');
    expect(screen.getByTestId('tuning-knob').style.getPropertyValue('--turn')).toBe('141deg');
  });

  it('toggles the sound with the SONIDO switch', async () => {
    const onToggleSound = vi.fn();
    renderWithI18n(receiver({ soundOn: false, onToggleSound }));
    const toggle = screen.getByRole('button', { name: 'SONIDO · OFF' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(onToggleSound).toHaveBeenCalledOnce();
  });
});

describe('OnAirLamp', () => {
  it('keeps the engraved label and says whether it is on', () => {
    const { rerender } = renderWithI18n(<OnAirLamp on={false} />);
    expect(screen.getByText('ON AIR')).toBeInTheDocument();
    expect(screen.getByText('OFF')).toBeInTheDocument();
    rerender(<OnAirLamp on />);
    expect(screen.getByText('ON')).toBeInTheDocument();
  });
});

describe('SMeter', () => {
  it('is a labelled image whose needle swings harder on air', () => {
    const { rerender } = renderWithI18n(<SMeter active={false} />);
    expect(screen.getByRole('img', { name: 'Medidor de señal' })).toBeInTheDocument();
    expect(screen.getByTestId('s-meter-needle').style.animation).toContain('cq-smeter-idle');
    rerender(<SMeter active />);
    expect(screen.getByTestId('s-meter-needle').style.animation).toContain('cq-smeter-air');
  });
});

describe('Rig', () => {
  it('sets the valve levels the dials, lamp and tally read', () => {
    const { container, rerender } = renderWithI18n(
      <Rig power="off" radio={<span />} microphone={<span />} />,
    );
    const deskset = container.firstElementChild as HTMLElement;
    expect(deskset.style.getPropertyValue('--power')).toBe('0.45');
    expect(deskset.style.getPropertyValue('--lamp')).toBe('0');
    rerender(<Rig power="on" radio={<span />} microphone={<span />} />);
    expect(deskset.style.getPropertyValue('--power')).toBe('1');
    expect(deskset.style.getPropertyValue('--tally')).toBe('1');
  });
});

describe('DeskMicrophone', () => {
  const handlers = () => ({ onCall: vi.fn(), onHangUp: vi.fn() });

  it('calls when pressed while off', async () => {
    const h = handlers();
    renderWithI18n(<DeskMicrophone state="off" {...h} />);
    expect(screen.getByText('MIC OFF')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Encender el micrófono y llamar' }));
    expect(h.onCall).toHaveBeenCalledOnce();
    expect(h.onHangUp).not.toHaveBeenCalled();
  });

  it('hangs up when pressed while live', async () => {
    const h = handlers();
    renderWithI18n(<DeskMicrophone state="on" {...h} />);
    expect(screen.getByText('MIC ON')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' }),
    );
    expect(h.onHangUp).toHaveBeenCalledOnce();
    expect(h.onCall).not.toHaveBeenCalled();
  });

  it('ignores presses while the QSL card prints', async () => {
    const h = handlers();
    renderWithI18n(<DeskMicrophone state="closing" {...h} />);
    expect(screen.getByText('MIC OFF · 73')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(h.onCall).not.toHaveBeenCalled();
    expect(h.onHangUp).not.toHaveBeenCalled();
  });

  it('speaks English when the UI does', () => {
    renderWithI18n(<DeskMicrophone state="off" {...handlers()} />, 'en');
    expect(
      screen.getByRole('button', { name: 'Switch on the microphone and call' }),
    ).toBeInTheDocument();
  });
});

describe('SplitStage', () => {
  it('opens in two with the aurora rift during a call', () => {
    const { container, rerender } = renderWithI18n(
      <SplitStage split={false} rift="off" call={false} left={<p>radio</p>} />,
    );
    const stage = container.firstElementChild as HTMLElement;
    expect(stage).toHaveAttribute('data-split', 'closed');
    expect(container.querySelector('.cq-rift')).toBeNull();

    rerender(<SplitStage split rift="on" call left={<p>radio</p>} right={<p>qso</p>} />);
    expect(stage).toHaveAttribute('data-split', 'open');
    expect(stage).toHaveAttribute('data-call', 'true');
    expect(container.querySelector('.cq-rift')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.cq-rift-core path')).toHaveLength(5);
    expect(screen.getByText('qso')).toBeInTheDocument();
  });
});
