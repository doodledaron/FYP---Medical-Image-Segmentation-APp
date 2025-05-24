export function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(toCamelCase);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        acc[camelKey] = toCamelCase(value);
        return acc;
      }, {} as any);
    }
    return obj;
  }