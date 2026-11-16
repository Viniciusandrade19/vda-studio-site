export const PRIVACY_EVENT = 'liderprev:privacy';
export const openPrivacy = () => window.dispatchEvent(new Event(PRIVACY_EVENT));
