import { useEffect, useRef } from 'react';

const BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  SELECT: 8,
  START: 9,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
};

export function useGamepad(callbacks) {
  const requestRef = useRef();
  const lastState = useRef({});
  // Use ref to hold latest callbacks without recreating the poll loop
  const cbRef = useRef(callbacks);

  useEffect(() => {
    cbRef.current = callbacks;
  });

  useEffect(() => {
    const poll = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];

      if (gp) {
        try {
          const isPressed = (i) => gp.buttons[i]?.pressed;

          const fire = (name, cbName) => {
            const pressed = isPressed(BUTTONS[name]);
            if (pressed && !lastState.current[name]) {
              lastState.current[name] = true;
              cbRef.current[cbName]?.();
            } else if (!pressed && lastState.current[name]) {
              lastState.current[name] = false;
            }
          };

          const A_HOLD_MS = 600;

          // ── A button: short press = select/details, hold = quick launch ────────
          const isAPressed = isPressed(BUTTONS.A);
          if (isAPressed && !lastState.current['A']) {
              lastState.current['A'] = true;
              lastState.current['aPressSince'] = Date.now();
              lastState.current['aHeld'] = false;
          }
          if (isAPressed && lastState.current['A'] && !lastState.current['aHeld']) {
              if (Date.now() - (lastState.current['aPressSince'] || 0) >= A_HOLD_MS) {
                  lastState.current['aHeld'] = true;
                  cbRef.current['onHoldA']?.();
              }
          }
          if (!isAPressed && lastState.current['A']) {
              lastState.current['A'] = false;
              if (!lastState.current['aHeld']) cbRef.current['onSelect']?.();
              lastState.current['aHeld'] = false;
          }

          fire('B',          'onBack');
          fire('Y',          'onOptions');
          fire('X',          'onX');
          fire('LB',         'onLB');
          fire('RB',         'onRB');
          fire('START',      'onStart');
          fire('SELECT',     'onMenu');

          // Left stick
          const xAxis = gp.axes[0];
          const yAxis = gp.axes[1];
          const DZ = 0.5;

          const axisCheck = (key, condition, cbName) => {
            if (condition && !lastState.current[key]) {
              lastState.current[key] = true;
              cbRef.current[cbName]?.();
            } else if (!condition && lastState.current[key]) {
              lastState.current[key] = false;
            }
          };

          axisCheck('stick_up',    yAxis < -DZ, 'onUp');
          axisCheck('stick_down',  yAxis >  DZ, 'onDown');
          axisCheck('stick_left',  xAxis < -DZ, 'onLeft');
          axisCheck('stick_right', xAxis >  DZ, 'onRight');

          // Right stick for bonus scroll without action
          const rx = gp.axes[2];
          const ry = gp.axes[3];
          axisCheck('rstick_up',    ry < -DZ, 'onRStickUp');
          axisCheck('rstick_down',  ry >  DZ, 'onRStickDown');
          axisCheck('rstick_left',  rx < -DZ, 'onRStickLeft');
          axisCheck('rstick_right', rx >  DZ, 'onRStickRight');

        } catch (err) {
          console.error('Gamepad poll error:', err);
        }
      }

      requestRef.current = requestAnimationFrame(poll);
    };

    requestRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // runs once
}
