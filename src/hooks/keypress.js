'use client';
import React, { useState, useEffect } from 'react';

export default function useKeyPress(targetKeys) {
    const [keyPressed, setKeyPressed] = useState(false);

    function downHandler({ key, ctrlKey }) {
       
        if (targetKeys.includes('Ctrl') && targetKeys.includes('Enter') && key === 'Enter' && ctrlKey) {
            setKeyPressed(true);
        }
    }

    function upHandler({ key }) {
        
        if (targetKeys.includes(key)) {
            setKeyPressed(false);
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', downHandler);
        document.addEventListener('keyup', upHandler);

        return () => {
            document.removeEventListener('keydown', downHandler);
            document.removeEventListener('keyup', upHandler);
        };
    }, [targetKeys]);

    return keyPressed;
}
