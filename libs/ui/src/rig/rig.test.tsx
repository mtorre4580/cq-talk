import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '../test/renderWithI18n';
import { DeskMicrophone } from './DeskMicrophone';
import { OnAirLamp } from './OnAirLamp';
import { SMeter } from './SMeter';
import { TopPlate } from './TopPlate';
import { TuningDial } from './TuningDial';
import { TuningKnob } from './TuningKnob';

describe('TopPlate', () => {
  it('uses the brand plate as the page heading', () => {
    renderWithI18n(<TopPlate onAir={false} soundOn onToggleSound={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: 'CQ talk' })).toBeInTheDocument();
    expect(screen.getByText('SSB TRANSCEIVER · MODEL 69')).toBeInTheDocument();
  });

  it('toggles the sound', async () => {
    const onToggleSound = vi.fn();
    renderWithI18n(<TopPlate onAir={false} soundOn={false} onToggleSound={onToggleSound} />);
    const toggle = screen.getByRole('button', { name: 'SONIDO · OFF' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(onToggleSound).toHaveBeenCalledOnce();
  });
});

describe('OnAirLamp', () => {
  it('keeps the text label whether on or off', () => {
    const { rerender } = renderWithI18n(<OnAirLamp on={false} />);
    expect(screen.getByText('ON AIR')).toBeInTheDocument();
    rerender(<OnAirLamp on />);
    expect(screen.getByText('ON AIR')).toBeInTheDocument();
  });
});

describe('SMeter', () => {
  it('is a labelled image whose needle swings only when active', () => {
    const { rerender } = renderWithI18n(<SMeter active={false} />);
    expect(screen.getByRole('img', { name: 'Medidor de señal' })).toBeInTheDocument();
    expect(screen.getByTestId('s-meter-needle').style.animation).toBe('none');
    rerender(<SMeter active />);
    expect(screen.getByTestId('s-meter-needle').style.animation).toContain('cq-vu');
  });
});

describe('TuningDial and TuningKnob', () => {
  it('shows the readout and moves the needle and knob together', () => {
    renderWithI18n(
      <>
        <TuningDial position={44} readout="BANDA MUNDIAL · 3–30" active={false} />
        <TuningKnob position={44} />
      </>,
    );
    expect(screen.getByText('BANDA MUNDIAL · 3–30')).toBeInTheDocument();
    expect(screen.getByText('MHz')).toBeInTheDocument();
    // jsdom simplifies the calc(): 18px + (100% - 36px) * 0.44 = 44% + 2.16px
    expect(screen.getByTestId('dial-needle').style.left).toBe('calc(44% + 2.16px)');
    expect(screen.getByTestId('tuning-knob').style.transform).toBe('rotate(141deg)');
  });
});

describe('DeskMicrophone', () => {
  it('is off before a call and ignores taps', async () => {
    const onHangUp = vi.fn();
    renderWithI18n(<DeskMicrophone state="off" onHangUp={onHangUp} />);
    expect(screen.getByText('MIC OFF')).toBeInTheDocument();
    expect(screen.getByText('Se enciende al llamar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Micrófono apagado' }));
    expect(onHangUp).not.toHaveBeenCalled();
  });

  it('hangs up when tapped while live', async () => {
    const onHangUp = vi.fn();
    renderWithI18n(<DeskMicrophone state="on" onHangUp={onHangUp} />);
    expect(screen.getByText('MIC ON')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' }),
    );
    expect(onHangUp).toHaveBeenCalledOnce();
  });

  it('tells the user the QSL card is printing while closing', () => {
    renderWithI18n(<DeskMicrophone state="closing" onHangUp={() => {}} />);
    expect(screen.getByText('MIC OFF · 73')).toBeInTheDocument();
    expect(screen.getByText('Imprimiendo tu tarjeta QSL…')).toBeInTheDocument();
  });

  it('speaks English when the UI does', () => {
    renderWithI18n(<DeskMicrophone state="off" onHangUp={() => {}} />, 'en');
    expect(screen.getByRole('button', { name: 'Microphone off' })).toBeInTheDocument();
  });
});
