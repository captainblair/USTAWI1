export function isPropertyOccupied(status: string | undefined | null): boolean {
  return status === "OCCUPIED";
}

export function isPropertyAvailable(status: string | undefined | null): boolean {
  return status === "ACTIVE";
}
