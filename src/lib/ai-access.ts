/** Fail closed for public deployments until verified user auth and durable quotas ship. */
export function isAiRuntimeAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}
