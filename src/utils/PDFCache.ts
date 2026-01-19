/**
 * PDFCache Utility
 * Uses the browser's Cache API to store and retrieve PDF blobs.
 */
const CACHE_NAME = 'arxiv-highlighter-pdf-cache-v1';

export const PDFCache = {
    /**
     * Get a PDF blob from cache or fetch it and store it.
     */
    async get(url: string): Promise<Uint8Array | null> {
        try {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                console.log('[PDFCache] Hit:', url);
                const arrayBuffer = await cachedResponse.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            }

            return null;
        } catch (error) {
            console.warn('[PDFCache] Get error:', error);
            return null;
        }
    },

    /**
     * Set a PDF blob in the cache.
     */
    async set(url: string, data: Uint8Array): Promise<void> {
        try {
            const cache = await caches.open(CACHE_NAME);
            // Use the underlying ArrayBuffer, sliced to the actual data size
            // Type assertion needed because TypeScript thinks buffer might be SharedArrayBuffer
            const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const response = new Response(blob, {
                headers: { 'Content-Type': 'application/pdf' }
            });
            await cache.put(url, response);
            console.log('[PDFCache] Stored:', url);
        } catch (error) {
            console.warn('[PDFCache] Set error:', error);
        }
    },

    /**
     * Clear all cached PDFs.
     */
    async clear(): Promise<void> {
        await caches.delete(CACHE_NAME);
    }
};
