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

export function useGamepad(callbacks, setIsConnected) {
  const requestRef = useRef();
  const lastState = useRef({});
  // Use ref to hold latest callbacks without recreating the poll loop
  const cbRef = useRef(callbacks);

  useEffect(() => {
    cbRef.current = callbacks;
  });

  useEffect(() => {
    const checkConnection = () => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gps.find(g => g !== null);
      if (!gp) {
          if (setIsConnected) setIsConnected(false);
          return;
      }
      
      // Determine Controller Type based on hardware ID
      const gpId = (gp.id || "").toLowerCase();
      const isPlayStation = gpId.includes('sony') || gpId.includes('dualshock') || gpId.includes('dualsense') || gpId.includes('054c') || gpId.includes('playstation');
      
      if (setIsConnected) setIsConnected(isPlayStation ? 'ps' : 'xbox');
    };
    
    window.addEventListener("gamepadconnected", checkConnection);
    window.addEventListener("gamepaddisconnected", checkConnection);
    checkConnection();

    const poll = () => {
      // Eğer tarayıcı penceresi o an aktif değilse (oyun açıksa vb.) gamepad tuşlarını YOK SAY.
      if (!document.hasFocus()) {
          requestRef.current = requestAnimationFrame(poll);
          return;
      }

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

          // ── A button: direct launch ──────────────────────────────────────────
          const isAPressed = isPressed(BUTTONS.A);
          if (isAPressed && !lastState.current['A']) {
              lastState.current['A'] = true;
              cbRef.current['onHoldA']?.();   // Play immediately on press
          }
          if (!isAPressed && lastState.current['A']) {
              lastState.current['A'] = false;
          }

          // ── Y button: open details ───────────────────────────────────────────
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
    return () => {
        cancelAnimationFrame(requestRef.current);
        window.removeEventListener("gamepadconnected", checkConnection);
        window.removeEventListener("gamepaddisconnected", checkConnection);
    };
  }, []); // runs once
}
