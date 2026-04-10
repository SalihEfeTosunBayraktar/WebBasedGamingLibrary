import { useEffect, useRef } from 'react';

const BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
};

export function useGamepad(callbacks) {
  const requestRef = useRef();
  const lastState = useRef({});
  const callbacksRef = useRef(callbacks); // Use ref to avoid recreating the loop if dependencies change

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const pollGamepads = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      
      if (gp) {
        const isPressed = (btnIndex) => gp.buttons[btnIndex]?.pressed;

        const checkButton = (btnIndex, name, callbackName) => {
          const pressed = isPressed(btnIndex);
          if (pressed && !lastState.current[name]) {
            lastState.current[name] = true;
            if (callbacksRef.current[callbackName]) callbacksRef.current[callbackName]();
          } else if (!pressed && lastState.current[name]) {
             lastState.current[name] = false;
          }
        };

        checkButton(BUTTONS.DPAD_UP, 'up', 'onUp');
        checkButton(BUTTONS.DPAD_DOWN, 'down', 'onDown');
        checkButton(BUTTONS.DPAD_LEFT, 'left', 'onLeft');
        checkButton(BUTTONS.DPAD_RIGHT, 'right', 'onRight');
        checkButton(BUTTONS.A, 'select', 'onSelect');
        checkButton(BUTTONS.B, 'back', 'onBack');
        checkButton(BUTTONS.Y, 'options', 'onOptions');
        checkButton(BUTTONS.LB, 'lb', 'onLB');
        checkButton(BUTTONS.RB, 'rb', 'onRB');
        
        const xAxis = gp.axes[0];
        const yAxis = gp.axes[1];
        const deadzone = 0.5;
        
        if (yAxis < -deadzone && !lastState.current['up_stick']) { lastState.current['up_stick'] = true; if(callbacksRef.current.onUp) callbacksRef.current.onUp(); }
        else if (yAxis >= -deadzone) lastState.current['up_stick'] = false;

        if (yAxis > deadzone && !lastState.current['down_stick']) { lastState.current['down_stick'] = true; if(callbacksRef.current.onDown) callbacksRef.current.onDown(); }
        else if (yAxis <= deadzone) lastState.current['down_stick'] = false;

        if (xAxis < -deadzone && !lastState.current['left_stick']) { lastState.current['left_stick'] = true; if(callbacksRef.current.onLeft) callbacksRef.current.onLeft(); }
        else if (xAxis >= -deadzone) lastState.current['left_stick'] = false;

        if (xAxis > deadzone && !lastState.current['right_stick']) { lastState.current['right_stick'] = true; if(callbacksRef.current.onRight) callbacksRef.current.onRight(); }
        else if (xAxis <= deadzone) lastState.current['right_stick'] = false;
      }
      requestRef.current = requestAnimationFrame(pollGamepads);
    };

    requestRef.current = requestAnimationFrame(pollGamepads);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);
}
