import { useState, useEffect } from 'react';

export default function useWindowDimensions() {

    const hasWindow = typeof window !== 'undefined';

    const [windowDimensions, setWindowDimensions] = useState(() => { const width = hasWindow ? window.innerWidth : null; const height = hasWindow ? window.innerHeight : null; return { width, height }; });

    useEffect(() => {
        if (hasWindow) {
            function handleResize() {
                setWindowDimensions(() => { const width = hasWindow ? window.innerWidth : null; const height = hasWindow ? window.innerHeight : null; return { width, height }; });
            }

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [hasWindow]);

    return windowDimensions;
}