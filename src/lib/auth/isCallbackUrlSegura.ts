export function isCallbackUrlSegura(
  callbackUrl: string | undefined
): callbackUrl is string {
  return (
    !!callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  );
}
