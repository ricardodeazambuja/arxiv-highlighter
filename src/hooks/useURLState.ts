import { useState, useEffect, useCallback } from 'preact/hooks';
import LZString from 'lz-string';

export interface Annotation {
    page: number;
    color: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    note: string;
}

export interface URLState {
    url: string;
    page: number;
    alpha: number;
    delay: number;
    search: boolean;
    annotations: Annotation[];
}

const DEFAULT_STATE: URLState = {
    url: '',
    page: 1,
    alpha: 0.3,
    delay: 300,
    search: true,
    annotations: [],
};

export function useURLState() {
    const [state, setState] = useState<URLState>(DEFAULT_STATE);

    const parseHash = useCallback(() => {
        const hash = window.location.hash.substring(1);
        if (!hash) return DEFAULT_STATE;

        const params = new URLSearchParams(hash);

        const url = params.get('url') || '';
        const page = parseInt(params.get('page') || '1', 10);
        const alpha = parseFloat(params.get('alpha') || '0.3');
        const delay = parseInt(params.get('delay') || '300', 10);
        const search = params.get('search') !== 'false';

        const cdatas = params.getAll('cdata');
        const annotations: Annotation[] = [];

        cdatas.forEach(cdata => {
            const decompressed = LZString.decompressFromEncodedURIComponent(cdata);
            if (decompressed) {
                const items = decompressed.split('&');
                items.forEach(item => {
                    const parts = item.split(',');
                    if (parts.length >= 6) {
                        annotations.push({
                            page: parseInt(parts[0], 10),
                            color: parts[1],
                            x1: parseFloat(parts[2]),
                            y1: parseFloat(parts[3]),
                            x2: parseFloat(parts[4]),
                            y2: parseFloat(parts[5]),
                            note: parts.slice(6).join(','),
                        });
                    }
                });
            }
        });

        return { url, page, alpha, delay, search, annotations };
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            setState(parseHash());
        };

        window.addEventListener('popstate', handlePopState);
        setState(parseHash());

        return () => window.removeEventListener('popstate', handlePopState);
    }, [parseHash]);

    const updateURL = useCallback((newState: Partial<URLState>) => {
        setState(currentState => {
            const combinedState = { ...currentState, ...newState };
            const params = new URLSearchParams();

            if (combinedState.url) params.set('url', combinedState.url);
            if (combinedState.page !== 1) params.set('page', combinedState.page.toString());
            if (combinedState.alpha !== 0.3) params.set('alpha', combinedState.alpha.toString());
            if (combinedState.delay !== 300) params.set('delay', combinedState.delay.toString());
            if (!combinedState.search) params.set('search', 'false');

            if (combinedState.annotations.length > 0) {
                const annotationStrings = combinedState.annotations.map(a =>
                    `${a.page},${a.color[0]},${a.x1},${a.y1},${a.x2},${a.y2},${a.note}`
                ).join('&');
                const compressed = LZString.compressToEncodedURIComponent(annotationStrings);
                params.set('cdata', compressed);
            }

            // Decode characters that don't need encoding in hash fragments
            const newHash = '#' + params.toString()
                .replace(/\+/g, '%20')
                .replace(/%3A/g, ':')
                .replace(/%2F/g, '/');
            if (window.location.hash !== newHash) {
                window.history.pushState(null, '', newHash);
            }

            return combinedState;
        });
    }, []);

    const setUrl = useCallback((url: string) => updateURL({ url, page: 1, annotations: [] }), [updateURL]);
    const setPage = useCallback((page: number) => updateURL({ page }), [updateURL]);
    const setAlpha = useCallback((alpha: number) => updateURL({ alpha }), [updateURL]);

    const addAnnotation = useCallback((ann: Annotation) => {
        updateURL({ annotations: [...state.annotations, ann] });
    }, [state.annotations, updateURL]);

    const updateAnnotation = useCallback((index: number, note: string) => {
        const newAnns = [...state.annotations];
        newAnns[index] = { ...newAnns[index], note };
        updateURL({ annotations: newAnns });
    }, [state.annotations, updateURL]);

    const deleteAnnotation = useCallback((index: number) => {
        const newAnns = [...state.annotations];
        newAnns.splice(index, 1);
        updateURL({ annotations: newAnns });
    }, [state.annotations, updateURL]);

    return {
        state,
        updateURL,
        setUrl,
        setPage,
        setAlpha,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation
    };
}
