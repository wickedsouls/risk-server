export const CatchGatewayErrors = (): any => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.log(error);
        return { error: true, message: error?.message };
      }
    };
    return descriptor;
  };
};
