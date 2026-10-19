const _selections: Record<string, Record<string, boolean>> = {};

export function getSelections(): Record<string, Record<string, boolean>> {
  return _selections;
}

export function setSelections(
  credentialId: string,
  toggles: Record<string, boolean>
): void {
  _selections[credentialId] = { ...toggles };
}

export function clearSelections(): void {
  for (const key of Object.keys(_selections)) {
    delete _selections[key];
  }
}

export function hasSelections(credentialId: string): boolean {
  return credentialId in _selections;
}
