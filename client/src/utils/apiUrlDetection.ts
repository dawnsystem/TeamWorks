/**
 * Utility functions for detecting and suggesting API URLs based on the current environment
 */

/**
 * Detects if the app is being accessed from a remote/non-localhost URL
 */
export function isRemoteAccess(): boolean {
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0';
}

/**
 * Suggests the appropriate API URL based on the current page URL
 */
export function suggestApiUrl(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If accessing from localhost, use localhost
  if (!isRemoteAccess()) {
    return 'http://localhost:3000/api';
  }
  
  // If accessing from a remote IP, suggest the same IP with port 3000
  return `${protocol}//${hostname}:3000/api`;
}

/**
 * Checks if the current API URL is likely to work based on the page URL
 */
export function isApiUrlLikelyCorrect(apiUrl: string): boolean {
  try {
    const apiHostname = new URL(apiUrl).hostname;
    const pageHostname = window.location.hostname;
    
    // If both are localhost or same IP, it's likely correct
    const localhostVariants = ['localhost', '127.0.0.1', '0.0.0.0'];
    const bothLocalhost = localhostVariants.includes(apiHostname) && localhostVariants.includes(pageHostname);
    const sameHost = apiHostname === pageHostname;
    
    return bothLocalhost || sameHost;
  } catch (e) {
    return false;
  }
}

/**
 * Gets a user-friendly explanation for why the current API URL might not work
 */
export function getApiUrlMismatchReason(apiUrl: string): string | null {
  try {
    const apiHostname = new URL(apiUrl).hostname;
    const pageHostname = window.location.hostname;
    
    const localhostVariants = ['localhost', '127.0.0.1', '0.0.0.0'];
    const apiIsLocalhost = localhostVariants.includes(apiHostname);
    const pageIsLocalhost = localhostVariants.includes(pageHostname);
    
    // If both are localhost variants, it's OK
    if (apiIsLocalhost && pageIsLocalhost) {
      return null;
    }
    
    const pageIsRemote = !pageIsLocalhost;
    
    if (apiIsLocalhost && pageIsRemote) {
      return `Estás accediendo desde ${pageHostname} pero la API está configurada para localhost. Cambia la URL de la API a: ${suggestApiUrl()}`;
    }
    
    if (apiHostname !== pageHostname) {
      return `La URL de la API (${apiHostname}) no coincide con la dirección actual (${pageHostname}). ¿Quizás debería ser: ${suggestApiUrl()}?`;
    }
    
    return null;
  } catch (e) {
    return 'La URL de la API no es válida';
  }
}
