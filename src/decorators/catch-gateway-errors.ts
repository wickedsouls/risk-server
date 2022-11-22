export const CatchGatewayErrors = (): MethodDecorator => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      try {
        return originalMethod.apply(this, args);
      } catch (error) {
        console.log(error);
        return { error: true, message: error?.message };
      }
    };
    return descriptor;
  };
};
