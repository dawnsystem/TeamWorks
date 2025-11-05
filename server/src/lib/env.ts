export class MissingEnvVarError extends Error {
  constructor(public readonly variable: string) {
    super(`La variable de entorno ${variable} no está configurada`);
    this.name = 'MissingEnvVarError';
  }
}

export const requireEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new MissingEnvVarError(name);
  }
  return value;
};

