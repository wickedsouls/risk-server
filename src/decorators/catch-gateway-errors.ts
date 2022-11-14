export const CatchGatewayErrors = (): any => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      try {
        return originalMethod.apply(this, args);
      } catch (error) {
        return { error: true, message: error?.message };
      }
    };
    return descriptor;
  };
};
