// Validate browser-storage data before React sees it. These are shape checks,
// not authentication: local storage remains editable by its owner.
export function record(value,label){if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`Invalid ${label}`);return value;}
export function strings(value,label){if(!Array.isArray(value)||value.some(item=>typeof item!=='string'))throw Error(`Invalid ${label}`);}
export function fields(value,names,label){record(value,label);for(const name of names)if(typeof value[name]!=='string')throw Error(`Invalid ${label}.${name}`);}
export function revision(value,label){if(!Number.isInteger(value)||value<1)throw Error(`Invalid ${label} revision`);}
export function booleans(value,names,label){for(const name of names)if(typeof value[name]!=='boolean')throw Error(`Invalid ${label}.${name}`);}
